// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./Interfaces.sol"; // Import file Interfaces.sol tập trung

// Contract SuppliersManagement quản lý nhà cung cấp và việc niêm yết mặt hàng
contract SuppliersManagement is AccessControl {
    // Sử dụng IRoleManagement từ Interfaces.sol
    IRoleManagement public roleManagementExternal;
    
    // Reference to ItemsBasicManagement contract
    address public itemsBasicManagementAddress;

    // --- MAPPINGS ---
    mapping(address => SupplierInfo) public suppliers;
    mapping(address => mapping(string => SupplierItemListing)) public supplierItemListings;

    // --- ARRAYS FOR ITERATION ---
    address[] public supplierAddresses;

    // --- EVENTS ---
    event SupplierProposed(address indexed supplierId, string name, address indexed proposer);
    event SupplierApprovedByBoard(address indexed supplierId, address indexed finalApprover);
    event SupplierItemListed(address indexed supplierAddress, string indexed itemId, uint256 price, bool autoApproved);
    event SupplierItemManuallyApprovedByBoard(address indexed supplierAddress, string indexed itemId, address indexed approver);

    // --- CONSTRUCTOR ---
    constructor(address _roleManagementExternalAddress, address _itemsBasicManagementAddress) {
        require(_roleManagementExternalAddress != address(0), "SuppliersM: Dia chi RM Ngoai khong hop le");
        require(_itemsBasicManagementAddress != address(0), "SuppliersM: Dia chi ItemsBasicM khong hop le");
        roleManagementExternal = IRoleManagement(_roleManagementExternalAddress);
        itemsBasicManagementAddress = _itemsBasicManagementAddress;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // --- MODIFIERS ---
    modifier onlyBoardMember() {
        require(roleManagementExternal.hasRole(roleManagementExternal.BOARD_ROLE(), msg.sender), "SuppliersM: Nguoi goi khong phai Thanh vien BDH");
        _;
    }

    modifier onlySupplier() {
        require(roleManagementExternal.hasRole(roleManagementExternal.SUPPLIER_ROLE(), msg.sender), "SuppliersM: Nguoi goi khong phai NCC (RM Ngoai)");
        require(suppliers[msg.sender].exists && suppliers[msg.sender].isApprovedByBoard, "SuppliersM: NCC chua duoc dang ky hoac phe duyet");
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

            require(approver != msg.sender, "SuppliersM: Nguoi de xuat khong the tu phe duyet");
            require(roleManagementExternal.hasRole(roleManagementExternal.BOARD_ROLE(), approver), "SuppliersM: Nguoi phe duyet khong phai thanh vien BDH");

            bool alreadyProcessed = false;
            for (uint j = 0; j < processedCount; j++) {
                if (processedApprovers[j] == approver) {
                    alreadyProcessed = true;
                    break;
                }
            }
            require(!alreadyProcessed, "SuppliersM: Nguoi phe duyet bi trung lap");

            totalApprovalShares += roleManagementExternal.getSharesPercentage(approver);

            processedApprovers[processedCount] = approver;
            processedCount++;
        }
        return totalApprovalShares > 5000; // 5000 means > 50.00% (since percentage is x100)
    }

    function _supplierExistsInArray(address _supplierId) internal view returns (bool) {
        for (uint i = 0; i < supplierAddresses.length; i++) {
            if (supplierAddresses[i] == _supplierId) return true;
        }
        return false;
    }

    // --- INTERFACE FUNCTIONS TO CALL ItemsBasicManagement ---
    function getItemInfo(string calldata _itemId) public view returns (bool exists, bool isApprovedByBoard, uint256 referencePriceCeiling) {
        // Call ItemsBasicManagement contract to get item info
        (bool success, bytes memory data) = itemsBasicManagementAddress.staticcall(
            abi.encodeWithSignature("getItemInfo(string)", _itemId)
        );
        
        if (success && data.length > 0) {
            // Decode the returned ItemInfo struct
            // Assuming ItemInfo has: itemId, name, description, category, exists, isApprovedByBoard, proposer, referencePriceCeiling
            (,,,, exists, isApprovedByBoard,, referencePriceCeiling) = abi.decode(data, (string, string, string, string, bool, bool, address, uint256));
        } else {
            exists = false;
            isApprovedByBoard = false;
            referencePriceCeiling = 0;
        }
    }

    // --- QUẢN LÝ NHÀ CUNG CẤP BỞI BAN ĐIỀU HÀNH ---
    function proposeNewSupplier(address _supplierId, string calldata _name) external onlyBoardMember {
        require(!suppliers[_supplierId].exists, "SuppliersM: ID NCC da ton tai");
        require(_supplierId != address(0), "SuppliersM: Dia chi NCC khong hop le");
        // Supplier must already have SUPPLIER_ROLE from RoleManagement
        require(roleManagementExternal.hasRole(roleManagementExternal.SUPPLIER_ROLE(), _supplierId), "SuppliersM: NCC de xuat thieu vai tro NCC tu RM");

        suppliers[_supplierId] = SupplierInfo({
            supplierId: _supplierId,
            name: _name,
            isApprovedByBoard: false,
            exists: true
        });

        if(!_supplierExistsInArray(_supplierId)){
            supplierAddresses.push(_supplierId);
        }
        emit SupplierProposed(_supplierId, _name, msg.sender);
    }

    function approveProposedSupplier(address _supplierId, address[] calldata _approvers) external onlyBoardMember {
        SupplierInfo storage sup = suppliers[_supplierId];
        require(sup.exists, "SuppliersM: NCC khong ton tai de phe duyet");
        require(!sup.isApprovedByBoard, "SuppliersM: NCC da duoc phe duyet roi");
        require(_getBoardApproval(_approvers), "SuppliersM: Khong du ty le co phan BDH phe duyet");

        sup.isApprovedByBoard = true;
        emit SupplierApprovedByBoard(_supplierId, msg.sender);
    }

    // --- NIÊM YẾT VÀ PHÊ DUYỆT MẶT HÀNG CỦA NHÀ CUNG CẤP ---
    function listSupplierItem(string calldata _itemId, uint256 _price) external onlySupplier {
        (bool itemExists, bool itemApproved, uint256 referencePriceCeiling) = getItemInfo(_itemId);
        require(itemExists && itemApproved, "SuppliersM: Mat hang khong ton tai hoac chua duoc BDH phe duyet chung");
        require(!supplierItemListings[msg.sender][_itemId].exists, "SuppliersM: Mat hang cua NCC da duoc niem yet");
        require(_price > 0, "SuppliersM: Gia phai la so duong");

        bool autoApproved = (referencePriceCeiling > 0 && _price <= referencePriceCeiling);

        supplierItemListings[msg.sender][_itemId] = SupplierItemListing({
            itemId: _itemId,
            supplierAddress: msg.sender,
            price: _price,
            isApprovedByBoard: autoApproved,
            exists: true
        });
        emit SupplierItemListed(msg.sender, _itemId, _price, autoApproved);
    }

    function approveSupplierItemManuallyByBoard(address _supplierAddress, string calldata _itemId, address[] calldata _approvers) external onlyBoardMember {
        require(suppliers[_supplierAddress].exists && suppliers[_supplierAddress].isApprovedByBoard, "SuppliersM: NCC khong ton tai hoac chua duoc BDH phe duyet");
        SupplierItemListing storage listing = supplierItemListings[_supplierAddress][_itemId];
        require(listing.exists, "SuppliersM: Mat hang cua NCC chua duoc niem yet");
        require(!listing.isApprovedByBoard, "SuppliersM: Mat hang nay cua NCC da duoc phe duyet roi");
        require(_getBoardApproval(_approvers), "SuppliersM: Khong du ty le co phan BDH phe duyet cho mat hang NCC nay");

        listing.isApprovedByBoard = true;
        emit SupplierItemManuallyApprovedByBoard(_supplierAddress, _itemId, msg.sender);
    }

    // --- VIEW FUNCTIONS ---
    function getSupplierInfo(address _supplierId) external view returns (SupplierInfo memory) {
        return suppliers[_supplierId];
    }

    function getSupplierItemDetails(address _supplierAddress, string calldata _itemId) external view returns (SupplierItemListing memory) {
        return supplierItemListings[_supplierAddress][_itemId];
    }

    function getAllSupplierAddresses() external view returns (address[] memory) {
        return supplierAddresses;
    }

    // --- ADMIN FUNCTIONS ---
    function updateItemsBasicManagementAddress(address _newAddress) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "SuppliersM: Chi admin moi duoc cap nhat dia chi");
        require(_newAddress != address(0), "SuppliersM: Dia chi moi khong hop le");
        itemsBasicManagementAddress = _newAddress;
    }
}
