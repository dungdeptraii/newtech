// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./Interfaces.sol"; // Import file Interfaces.sol tập trung

// Contract ItemsBasicManagement quản lý mặt hàng cơ bản và địa điểm
contract ItemsBasicManagement is AccessControl {
    // Sử dụng IRoleManagement từ Interfaces.sol
    IRoleManagement public roleManagementExternal;

    // --- STRUCT DEFINITIONS ---
    struct ItemInfo {
        string itemId;
        string name;
        string description;
        string category;
        bool exists;
        bool isApprovedByBoard;
        address proposer; // Thành viên BĐH đề xuất
        uint256 referencePriceCeiling; // Giá trần tham khảo do BĐH đặt
    }

    // --- MAPPINGS ---
    mapping(string => ItemInfo) public items;
    mapping(address => PhysicalLocationInfo) public physicalLocations;
    mapping(address => mapping(string => uint256)) public storeItemRetailPrices;

    // --- ARRAYS FOR ITERATION ---
    string[] public itemIds;
    address[] public locationAddresses;

    // --- EVENTS ---
    event ItemProposed(string indexed itemId, string name, address indexed proposer);
    event ItemApprovedByBoard(string indexed itemId, uint256 referencePriceCeiling, address indexed finalApprover);
    event PhysicalLocationProposed(address indexed locationId, string name, string locationType, address indexed proposer);
    event PhysicalLocationApprovedByBoard(address indexed locationId, address indexed finalApprover);
    event PhysicalLocationManagerAssigned(address indexed locationId, address newManager, address indexed byDirector);
    event StoreDesignatedSourceWarehouseSet(address indexed storeAddress, address indexed designatedWarehouse, address indexed byStoreDirector);
    event RetailPriceSet(address indexed storeAddress, string indexed itemId, uint256 price, address indexed byStoreDirector);

    // --- CONSTRUCTOR ---
    constructor(address _roleManagementExternalAddress) {
        require(_roleManagementExternalAddress != address(0), "ItemsBasicM: Dia chi RM Ngoai khong hop le");
        roleManagementExternal = IRoleManagement(_roleManagementExternalAddress);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // --- MODIFIERS ---
    modifier onlyBoardMember() {
        require(roleManagementExternal.hasRole(roleManagementExternal.BOARD_ROLE(), msg.sender), "ItemsBasicM: Nguoi goi khong phai Thanh vien BDH");
        _;
    }

    modifier onlyStoreDirector() {
        bytes32 sdRole = roleManagementExternal.STORE_DIRECTOR_ROLE();
        require(roleManagementExternal.hasRole(sdRole, msg.sender), "ItemsBasicM: Nguoi goi thieu vai tro GIAM_DOC_CH (RM Ngoai)");
        _;
    }

    modifier onlyWarehouseDirector() {
        bytes32 wdRole = roleManagementExternal.WAREHOUSE_DIRECTOR_ROLE();
        require(roleManagementExternal.hasRole(wdRole, msg.sender), "ItemsBasicM: Nguoi goi thieu vai tro GIAM_DOC_KHO (RM Ngoai)");
        _;
    }

    // --- INTERNAL FUNCTIONS ---
    function _getBoardApproval(address[] memory _approvers) internal view returns (bool) {
        if (_approvers.length == 0) return false;
        uint256 totalApprovalShares = 0;

        address[] memory processedApprovers = new address[](_approvers.length);
        uint processedCount = 0;

        for (uint i = 0; i < _approvers.length; i++) {
            address approver = _approvers[i];

            require(approver != msg.sender, "ItemsBasicM: Nguoi de xuat khong the tu phe duyet");
            require(roleManagementExternal.hasRole(roleManagementExternal.BOARD_ROLE(), approver), "ItemsBasicM: Nguoi phe duyet khong phai thanh vien BDH");

            bool alreadyProcessed = false;
            for (uint j = 0; j < processedCount; j++) {
                if (processedApprovers[j] == approver) {
                    alreadyProcessed = true;
                    break;
                }
            }
            require(!alreadyProcessed, "ItemsBasicM: Nguoi phe duyet bi trung lap");

            totalApprovalShares += roleManagementExternal.getSharesPercentage(approver);

            processedApprovers[processedCount] = approver;
            processedCount++;
        }
        return totalApprovalShares > 5000; // 5000 means > 50.00% (since percentage is x100)
    }

    function _itemExistsInArray(string calldata _itemId) internal view returns (bool) {
        for (uint i = 0; i < itemIds.length; i++) {
            if (keccak256(abi.encodePacked(itemIds[i])) == keccak256(abi.encodePacked(_itemId))) return true;
        }
        return false;
    }

    function _locationExistsInArray(address _locationId) internal view returns (bool) {
        for (uint i = 0; i < locationAddresses.length; i++) {
            if (locationAddresses[i] == _locationId) return true;
        }
        return false;
    }

    // --- QUẢN LÝ MẶT HÀNG BỞI BAN ĐIỀU HÀNH ---
    function proposeNewItem(string calldata _itemId, string calldata _name, string calldata _description, string calldata _category) external onlyBoardMember {
        require(!items[_itemId].exists, "ItemsBasicM: ID mat hang da ton tai");
        require(bytes(_itemId).length > 0, "ItemsBasicM: ID mat hang khong duoc rong");

        items[_itemId] = ItemInfo({
            itemId: _itemId,
            name: _name,
            description: _description,
            category: _category,
            exists: true,
            isApprovedByBoard: false,
            proposer: msg.sender,
            referencePriceCeiling: 0
        });

        if (!_itemExistsInArray(_itemId)) {
            itemIds.push(_itemId);
        }
        emit ItemProposed(_itemId, _name, msg.sender);
    }

    function approveProposedItem(string calldata _itemId, uint256 _referencePriceCeiling, address[] calldata _approvers) external onlyBoardMember {
        ItemInfo storage item = items[_itemId];
        require(item.exists, "ItemsBasicM: Mat hang khong ton tai de phe duyet");
        require(!item.isApprovedByBoard, "ItemsBasicM: Mat hang da duoc phe duyet roi");
        require(_referencePriceCeiling > 0, "ItemsBasicM: Gia tran tham khao phai lon hon 0");
        require(_getBoardApproval(_approvers), "ItemsBasicM: Khong du ty le co phan BDH phe duyet");

        item.isApprovedByBoard = true;
        item.referencePriceCeiling = _referencePriceCeiling;
        emit ItemApprovedByBoard(_itemId, _referencePriceCeiling, msg.sender);
    }

    // --- QUẢN LÝ ĐỊA ĐIỂM BỞI BAN ĐIỀU HÀNH ---
    function proposeNewPhysicalLocation(address _locationId, string calldata _name, string calldata _locationType) external onlyBoardMember {
        require(!physicalLocations[_locationId].exists, "ItemsBasicM: ID dia diem da ton tai");
        require(_locationId != address(0), "ItemsBasicM: Dia chi dia diem khong hop le");
        bytes32 typeHash = keccak256(abi.encodePacked(_locationType));
        require(typeHash == keccak256(abi.encodePacked("STORE")) || typeHash == keccak256(abi.encodePacked("WAREHOUSE")), "ItemsBasicM: Loai dia diem khong hop le");

        physicalLocations[_locationId] = PhysicalLocationInfo({
            locationId: _locationId,
            name: _name,
            locationType: _locationType,
            manager: address(0), // Manager to be assigned later by relevant Director
            exists: true,
            isApprovedByBoard: false,
            designatedSourceWarehouseAddress: address(0) // For stores, to be set later
        });

        if (!_locationExistsInArray(_locationId)) {
            locationAddresses.push(_locationId);
        }
        emit PhysicalLocationProposed(_locationId, _name, _locationType, msg.sender);
    }

    function approveProposedPhysicalLocation(address _locationId, address[] calldata _approvers) external onlyBoardMember {
        PhysicalLocationInfo storage loc = physicalLocations[_locationId];
        require(loc.exists, "ItemsBasicM: Dia diem khong ton tai de phe duyet");
        require(!loc.isApprovedByBoard, "ItemsBasicM: Dia diem da duoc phe duyet roi");
        require(_getBoardApproval(_approvers), "ItemsBasicM: Khong du ty le co phan BDH phe duyet");

        loc.isApprovedByBoard = true;
        emit PhysicalLocationApprovedByBoard(_locationId, msg.sender);
    }

    function assignManagerToLocation(address _locationId, address _managerId) external {
        PhysicalLocationInfo storage loc = physicalLocations[_locationId];
        require(loc.exists && loc.isApprovedByBoard, "ItemsBasicM: Dia diem chua ton tai hoac chua duoc BDH phe duyet");
        require(loc.manager == address(0), "ItemsBasicM: Dia diem da co quan ly");

        bytes32 expectedManagerRole;
        bool callerIsAuthorized = false;

        if (keccak256(abi.encodePacked(loc.locationType)) == keccak256(abi.encodePacked("STORE"))) {
            expectedManagerRole = roleManagementExternal.STORE_MANAGER_ROLE();
            if (roleManagementExternal.hasRole(roleManagementExternal.STORE_DIRECTOR_ROLE(), msg.sender)) {
                callerIsAuthorized = true;
            }
        } else if (keccak256(abi.encodePacked(loc.locationType)) == keccak256(abi.encodePacked("WAREHOUSE"))) {
            expectedManagerRole = roleManagementExternal.WAREHOUSE_MANAGER_ROLE();
            if (roleManagementExternal.hasRole(roleManagementExternal.WAREHOUSE_DIRECTOR_ROLE(), msg.sender)) {
                callerIsAuthorized = true;
            }
        } else {
            revert("ItemsBasicM: Loai dia diem khong xac dinh de gan quan ly");
        }

        require(callerIsAuthorized, "ItemsBasicM: Nguoi goi khong co quyen gan quan ly cho loai dia diem nay");
        require(roleManagementExternal.hasRole(expectedManagerRole, _managerId), "ItemsBasicM: Nguoi duoc gan lam quan ly thieu vai tro phu hop");

        loc.manager = _managerId;
        emit PhysicalLocationManagerAssigned(_locationId, _managerId, msg.sender);
    }

    function setDesignatedSourceWarehouseForStore(address _storeAddress, address _warehouseAddress) external onlyStoreDirector {
        PhysicalLocationInfo storage storeInfo = physicalLocations[_storeAddress];
        require(storeInfo.exists && storeInfo.isApprovedByBoard && keccak256(abi.encodePacked(storeInfo.locationType)) == keccak256(abi.encodePacked("STORE")), "ItemsBasicM: Cua hang khong ton tai, chua duoc BDH phe duyet, hoac khong phai la cua hang");

        if (_warehouseAddress != address(0)) {
            PhysicalLocationInfo memory warehouseInfo = physicalLocations[_warehouseAddress];
            require(warehouseInfo.exists && warehouseInfo.isApprovedByBoard && keccak256(abi.encodePacked(warehouseInfo.locationType)) == keccak256(abi.encodePacked("WAREHOUSE")), "ItemsBasicM: Kho nguon chi dinh khong hop le, chua duoc BDH phe duyet, hoac khong phai la kho");
        }

        storeInfo.designatedSourceWarehouseAddress = _warehouseAddress;
        emit StoreDesignatedSourceWarehouseSet(_storeAddress, _warehouseAddress, msg.sender);
    }

    // --- THIẾT LẬP GIÁ BÁN LẺ TẠI CỬA HÀNG ---
    function setStoreItemRetailPrice(address _storeAddress, string calldata _itemId, uint256 _price) external onlyStoreDirector {
        require(items[_itemId].exists && items[_itemId].isApprovedByBoard, "ItemsBasicM: Mat hang khong ton tai hoac chua duoc BDH phe duyet");
        PhysicalLocationInfo memory storeInfo = physicalLocations[_storeAddress];
        require(storeInfo.exists && storeInfo.isApprovedByBoard && keccak256(abi.encodePacked(storeInfo.locationType)) == keccak256(abi.encodePacked("STORE")), "ItemsBasicM: Cua hang khong ton tai, chua duoc BDH phe duyet, hoac khong phai la cua hang");
        require(_price > 0, "ItemsBasicM: Gia le phai la so duong");

        storeItemRetailPrices[_storeAddress][_itemId] = _price;
        emit RetailPriceSet(_storeAddress, _itemId, _price, msg.sender);
    }

    // --- VIEW FUNCTIONS ---
    function getItemInfo(string calldata _itemId) external view returns (ItemInfo memory) {
        return items[_itemId];
    }

    function getPhysicalLocationInfo(address _locationId) external view returns (PhysicalLocationInfo memory) {
        return physicalLocations[_locationId];
    }

    function getStoreInfo(address _storeAddress) external view returns (PhysicalLocationInfo memory) {
        PhysicalLocationInfo memory loc = physicalLocations[_storeAddress];
        require(loc.exists && keccak256(abi.encodePacked(loc.locationType)) == keccak256(abi.encodePacked("STORE")), "ItemsBasicM: Khong phai la cua hang");
        return loc;
    }

    function getWarehouseInfo(address _warehouseAddress) external view returns (PhysicalLocationInfo memory) {
        PhysicalLocationInfo memory loc = physicalLocations[_warehouseAddress];
        require(loc.exists && keccak256(abi.encodePacked(loc.locationType)) == keccak256(abi.encodePacked("WAREHOUSE")), "ItemsBasicM: Khong phai la kho");
        return loc;
    }

    function getItemRetailPriceAtStore(string calldata _itemId, address _storeAddress) external view returns (uint256 price, bool priceExists) {
        price = storeItemRetailPrices[_storeAddress][_itemId];
        return (price, price > 0);
    }

    function getAllItemIds() external view returns (string[] memory) {
        return itemIds;
    }

    function getAllLocationAddresses() external view returns (address[] memory) {
        return locationAddresses;
    }
}
