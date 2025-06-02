// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Interfaces.sol";      // Import file Interfaces.sol tập trung
import "./ItemsBasicManagement.sol"; // Import ItemsBasicManagement để trình biên dịch liên kết contract
import "./SuppliersManagement.sol"; // Import SuppliersManagement để trình biên dịch liên kết contract

// Hợp đồng Quản lý Đơn hàng Kho - Nhà cung cấp
contract WarehouseSupplierOrderManagement is ReentrancyGuard, Ownable {
    // Sử dụng các interface từ Interfaces.sol
    IRoleManagementInterface public immutable roleManagement;
    IItemsBasicManagementInterface public immutable itemsBasicManagement;
    ISuppliersManagementInterface public immutable suppliersManagement;
    ICompanyTreasuryManagerInterface public immutable companyTreasuryManager;
    IWarehouseInventoryManagementInterface public warehouseInventoryManagement; // Sẽ được set sau

    uint256 public nextWSOrderId; // ID cho đơn hàng Kho-NCC tiếp theo

    // Trạng thái đơn hàng Kho-NCC
    enum WSOrderStatus {
        PendingShipment,         // 0: Chờ NCC giao hàng (đã ký quỹ)
        ShippedBySupplier,       // 1: NCC đã xác nhận giao hàng
        ReceivedByWarehouse,     // 2: Kho đã xác nhận nhận hàng (đã giải ngân)
        CancelledByWarehouse,    // 3: Kho hủy (trước khi NCC giao)
        CancelledBySupplier      // 4: NCC hủy (trước khi NCC giao)
    }

    // Mặt hàng trong đơn Kho-NCC
    struct WSOrderItem {
        string itemId;
        uint256 quantity;
        uint256 unitPrice; // Giá tại thời điểm đặt hàng
    }

    // Cấu trúc đơn hàng Kho-NCC
    struct WSOrder {
        uint256 wsOrderId;
        address warehouseAddress;   // Kho đặt hàng
        address warehouseManager;   // Quản lý kho đã đặt hàng
        address supplierAddress;    // Nhà cung cấp
        WSOrderItem[] items;        // Danh sách mặt hàng
        uint256 totalAmount;        // Tổng giá trị đơn hàng (đã ký quỹ)
        WSOrderStatus status;
        uint256 creationTimestamp;
        uint256 lastUpdateTimestamp;
        bool fundsEscrowed;         // Cờ cho biết tiền đã được CTM ký quỹ thành công
        bool fundsReleasedToSupplier; // Cờ cho biết tiền đã được CTM giải ngân cho NCC
        string internalSupplierOrderId; // ID duy nhất được sử dụng để tương tác với CTM cho việc ký quỹ
    }

    // Dữ liệu đầu vào từ Quản lý Kho khi đặt hàng
    struct WSOrderItemInput {
        string itemId;
        uint256 quantity;
    }

    mapping(uint256 => WSOrder) public wsOrders;
    mapping(address => uint256[]) public warehouseSentOrderIds;    // warehouseAddress => array of wsOrderIds
    mapping(address => uint256[]) public supplierReceivedOrderIds; // supplierAddress => array of wsOrderIds

    // --- EVENTS ---
    event WSOrderPlaced(uint256 indexed wsOrderId, address indexed warehouseAddress, address indexed supplierAddress, uint256 totalAmount, string internalSupplierOrderId);
    event WSOrderShipmentConfirmedBySupplier(uint256 indexed wsOrderId, address indexed supplierAddress);
    event WSOrderReceiptConfirmedByWarehouse(uint256 indexed wsOrderId, address indexed warehouseManager);
    event WSOrderCancelledByWarehouse(uint256 indexed wsOrderId, address indexed warehouseManager, string reason);
    event WSOrderCancelledBySupplier(uint256 indexed wsOrderId, address indexed supplierAddress, string reason);
    event WSOrderFundsReleasedToSupplier(uint256 indexed wsOrderId, address indexed supplierAddress, uint256 amount); // Khi CTM giải ngân thành công
    event EscrowRequestedForWSOrder(uint256 indexed wsOrderId, uint256 amount, string internalSupplierOrderId); // Khi yêu cầu CTM ký quỹ
    event WSOrderStatusUpdated(uint256 indexed wsOrderId, WSOrderStatus newStatus, uint256 timestamp);

    // Admin/Owner events
    event WarehouseInventoryManagementAddressSet(address indexed wimAddress);

    // --- CONSTRUCTOR ---
    constructor(
        address _roleManagementAddress,
        address _itemsBasicManagementAddress,
        address _suppliersManagementAddress,
        address _companyTreasuryManagerAddress
    ) Ownable() {
        require(_roleManagementAddress != address(0), "WSOM: Dia chi RM khong hop le");
        roleManagement = IRoleManagementInterface(_roleManagementAddress);

        require(_itemsBasicManagementAddress != address(0), "WSOM: Dia chi ItemsBasicM khong hop le");
        itemsBasicManagement = IItemsBasicManagementInterface(_itemsBasicManagementAddress);

        require(_suppliersManagementAddress != address(0), "WSOM: Dia chi SuppliersM khong hop le");
        suppliersManagement = ISuppliersManagementInterface(_suppliersManagementAddress);

        require(_companyTreasuryManagerAddress != address(0), "WSOM: Dia chi CTM khong hop le");
        companyTreasuryManager = ICompanyTreasuryManagerInterface(_companyTreasuryManagerAddress);

        nextWSOrderId = 1;
    }

    // --- SETTER (Owner only) ---
    function setWarehouseInventoryManagementAddress(address _wimAddress) external onlyOwner {
        require(_wimAddress != address(0), "WSOM: Dia chi WIM khong hop le");
        warehouseInventoryManagement = IWarehouseInventoryManagementInterface(_wimAddress);
        emit WarehouseInventoryManagementAddressSet(_wimAddress);
    }

    // --- MODIFIERS ---
    modifier onlyWarehouseManagerForAction(address _warehouseAddress) {
        require(_warehouseAddress != address(0), "WSOM: Dia chi kho khong hop le");
        // Sử dụng PhysicalLocationInfo từ Interfaces.sol (forward-declared)
        PhysicalLocationInfo memory warehouseInfo = itemsBasicManagement.getWarehouseInfo(_warehouseAddress);
        require(warehouseInfo.exists, "WSOM: Kho khong ton tai");
        require(warehouseInfo.manager == msg.sender, "WSOM: Nguoi goi khong phai quan ly kho nay");

        bytes32 whManagerRole = roleManagement.WAREHOUSE_MANAGER_ROLE();
        require(roleManagement.hasRole(whManagerRole, msg.sender), "WSOM: Nguoi goi thieu vai tro QUAN_LY_KHO");
        _;
    }

    modifier onlyOrderWarehouseManager(uint256 _wsOrderId) {
        WSOrder storage currentOrder = wsOrders[_wsOrderId];
        require(currentOrder.wsOrderId != 0, "WSOM: Don hang khong ton tai"); // Check if order exists
        require(currentOrder.warehouseManager == msg.sender, "WSOM: Nguoi goi khong phai quan ly kho cua don hang");

        bytes32 whManagerRole = roleManagement.WAREHOUSE_MANAGER_ROLE();
        require(roleManagement.hasRole(whManagerRole, msg.sender), "WSOM: Nguoi goi thieu vai tro QUAN_LY_KHO");
        _;
    }

    modifier onlyOrderSupplier(uint256 _wsOrderId) {
        WSOrder storage currentOrder = wsOrders[_wsOrderId];
        require(currentOrder.wsOrderId != 0, "WSOM: Don hang khong ton tai");
        require(currentOrder.supplierAddress == msg.sender, "WSOM: Nguoi goi khong phai NCC cua don hang");

        bytes32 supRole = roleManagement.SUPPLIER_ROLE();
        require(roleManagement.hasRole(supRole, msg.sender), "WSOM: Nguoi goi thieu vai tro NCC");
        _;
    }


    // --- INTERNAL HELPER FUNCTIONS ---
    function _processOrderItems(
        WSOrderItemInput[] calldata _itemsInput,
        address _supplierAddress,
        WSOrderItem[] storage _orderItems // Pass by storage reference to modify directly
    ) internal returns (uint256 calculatedTotalAmount) {
        calculatedTotalAmount = 0;
        for (uint i = 0; i < _itemsInput.length; i++) {
            WSOrderItemInput calldata itemInput = _itemsInput[i];
            require(itemInput.quantity > 0, "WSOM: So luong mat hang phai la so duong");

            // Sử dụng SupplierItemListing từ Interfaces.sol (forward-declared)
            SupplierItemListing memory supplierListing = suppliersManagement.getSupplierItemDetails(_supplierAddress, itemInput.itemId);
            require(supplierListing.exists && supplierListing.isApprovedByBoard, "WSOM: Mat hang cua NCC khong co san hoac chua duoc phe duyet boi BDH");

            _orderItems.push(WSOrderItem({
                itemId: itemInput.itemId,
                quantity: itemInput.quantity,
                unitPrice: supplierListing.price
            }));
            calculatedTotalAmount += supplierListing.price * itemInput.quantity;
        }
    }

    function _validateAndRequestEscrow(
        address _warehouseAddress,
        address _supplierAddress,
        string memory _internalOrderId,
        uint256 _orderTotal
    ) internal returns (bool) { // Returns true if escrow request to CTM was successful
        uint256 maxAmountPerOrderPolicy = companyTreasuryManager.getWarehouseSpendingPolicy(_warehouseAddress, _supplierAddress);
        uint256 currentSpendingThisPeriod = companyTreasuryManager.getWarehouseSpendingThisPeriod(_warehouseAddress);
        uint256 spendingLimitPerPeriod = companyTreasuryManager.WAREHOUSE_SPENDING_LIMIT_PER_PERIOD_CONST();

        require(maxAmountPerOrderPolicy > 0, "WSOM: Khong co chinh sach chi tieu tu Ngan quy cho kho/ncc nay");
        require(_orderTotal <= maxAmountPerOrderPolicy, "WSOM: Gia tri don hang vuot qua chinh sach chi tieu moi don hang");

        uint256 projectedSpending = currentSpendingThisPeriod + _orderTotal;
        require(projectedSpending <= spendingLimitPerPeriod, "WSOM: Don hang vuot qua gioi han chi tieu dinh ky cua kho");

        bool escrowSuccess = companyTreasuryManager.requestEscrowForSupplierOrder(
            _warehouseAddress, _supplierAddress, _internalOrderId, _orderTotal
        );
        emit EscrowRequestedForWSOrder(wsOrders[nextWSOrderId-1].wsOrderId, _orderTotal, _internalOrderId); // Assuming nextWSOrderId was just incremented
        return escrowSuccess;
    }

    function uintToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        uint256 i = digits;
        while (value != 0) { i--; buffer[i] = bytes1(uint8(48 + (value % 10))); value /= 10; }
        return string(buffer);
    }

    // --- CORE ORDER FUNCTIONS ---
    function placeOrderByWarehouse(
        address _warehouseAddress,    // Warehouse placing the order (msg.sender must be its manager)
        address _supplierAddress,
        WSOrderItemInput[] calldata _itemsInput
    ) external onlyWarehouseManagerForAction(_warehouseAddress) nonReentrant {
        require(address(warehouseInventoryManagement) != address(0), "WSOM: Dia chi WIM chua duoc dat");
        require(_itemsInput.length > 0, "WSOM: Don hang phai co it nhat mot mat hang");

        // Sử dụng SupplierInfo từ Interfaces.sol (forward-declared)
        SupplierInfo memory supplierInfo = suppliersManagement.getSupplierInfo(_supplierAddress);
        require(supplierInfo.exists && supplierInfo.isApprovedByBoard, "WSOM: NCC khong hop le hoac chua duoc phe duyet");

        uint256 currentWsOrderId = nextWSOrderId++;
        // Generate a unique ID for CTM escrow, e.g., "WSOM-ORDER-123"
        string memory internalOrderIdForEscrow = string(abi.encodePacked("WSOM-ORDER-", uintToString(currentWsOrderId)));

        WSOrder storage newOrder = wsOrders[currentWsOrderId];
        newOrder.wsOrderId = currentWsOrderId;
        newOrder.warehouseAddress = _warehouseAddress;
        newOrder.warehouseManager = msg.sender;
        newOrder.supplierAddress = _supplierAddress;
        newOrder.status = WSOrderStatus.PendingShipment; // Initial status
        newOrder.creationTimestamp = block.timestamp;
        newOrder.lastUpdateTimestamp = block.timestamp;
        newOrder.internalSupplierOrderId = internalOrderIdForEscrow;

        // Process items and calculate total amount - _processOrderItems modifies newOrder.items directly
        newOrder.totalAmount = _processOrderItems(_itemsInput, _supplierAddress, newOrder.items);
        require(newOrder.totalAmount > 0, "WSOM: Tong gia tri don hang phai lon hon 0");

        // Validate spending policies and request escrow from CompanyTreasuryManager
        bool escrowSuccess = _validateAndRequestEscrow(
            _warehouseAddress,
            _supplierAddress,
            internalOrderIdForEscrow,
            newOrder.totalAmount
        );
        require(escrowSuccess, "WSOM: Ky quy tien tu CTM that bai");
        newOrder.fundsEscrowed = true;

        warehouseSentOrderIds[_warehouseAddress].push(currentWsOrderId);
        supplierReceivedOrderIds[_supplierAddress].push(currentWsOrderId);

        emit WSOrderPlaced(currentWsOrderId, _warehouseAddress, _supplierAddress, newOrder.totalAmount, internalOrderIdForEscrow);
        emit WSOrderStatusUpdated(currentWsOrderId, newOrder.status, block.timestamp);
    }

    function supplierConfirmShipment(uint256 _wsOrderId) external onlyOrderSupplier(_wsOrderId) nonReentrant {
        WSOrder storage currentOrder = wsOrders[_wsOrderId];
        require(currentOrder.status == WSOrderStatus.PendingShipment, "WSOM: Don hang khong o trang thai cho giao hang");

        currentOrder.status = WSOrderStatus.ShippedBySupplier;
        currentOrder.lastUpdateTimestamp = block.timestamp;

        emit WSOrderShipmentConfirmedBySupplier(_wsOrderId, msg.sender);
        emit WSOrderStatusUpdated(_wsOrderId, currentOrder.status, block.timestamp);
    }

    function warehouseConfirmReceipt(uint256 _wsOrderId) external onlyOrderWarehouseManager(_wsOrderId) nonReentrant {
        WSOrder storage currentOrder = wsOrders[_wsOrderId];
        require(currentOrder.status == WSOrderStatus.ShippedBySupplier, "WSOM: Don hang chua duoc NCC giao");
        require(currentOrder.fundsEscrowed, "WSOM: Tien chua duoc ky quy cho don hang nay");
        require(!currentOrder.fundsReleasedToSupplier, "WSOM: Tien da duoc giai ngan cho NCC roi");
        require(address(warehouseInventoryManagement) != address(0), "WSOM: Dia chi WIM chua duoc dat");

        // Request CTM to release funds to supplier
        bool releaseSuccess = companyTreasuryManager.releaseEscrowToSupplier(
            currentOrder.supplierAddress,
            currentOrder.internalSupplierOrderId,
            currentOrder.totalAmount
        );
        require(releaseSuccess, "WSOM: Giai ngan tien cho NCC tu CTM that bai");

        currentOrder.status = WSOrderStatus.ReceivedByWarehouse;
        currentOrder.fundsReleasedToSupplier = true;
        currentOrder.lastUpdateTimestamp = block.timestamp;

        // Record stock in WarehouseInventoryManagement for each item
        for (uint i = 0; i < currentOrder.items.length; i++) {
            WSOrderItem memory item = currentOrder.items[i];
            warehouseInventoryManagement.recordStockInFromSupplier(
                currentOrder.warehouseAddress,
                item.itemId,
                item.quantity,
                _wsOrderId // Pass the WSOM order ID for WIM to link
            );
        }

        emit WSOrderReceiptConfirmedByWarehouse(_wsOrderId, msg.sender);
        emit WSOrderFundsReleasedToSupplier(_wsOrderId, currentOrder.supplierAddress, currentOrder.totalAmount);
        emit WSOrderStatusUpdated(_wsOrderId, currentOrder.status, block.timestamp);
    }

    function _internalCancelOrder(uint256 _wsOrderId, WSOrderStatus _newStatus, address) internal {
        WSOrder storage currentOrder = wsOrders[_wsOrderId];
        // Order can only be cancelled if it's pending shipment from supplier
        require(currentOrder.status == WSOrderStatus.PendingShipment, "WSOM: Don hang khong o trang thai co the huy");
        require(currentOrder.fundsEscrowed, "WSOM: Tien chua duoc ky quy (hoac da bi huy) de huy");

        // Request CTM to refund the escrowed amount back to treasury (effectively cancelling the escrow)
        bool refundSuccess = companyTreasuryManager.refundEscrowToTreasury(
            currentOrder.warehouseAddress,
            currentOrder.internalSupplierOrderId,
            currentOrder.totalAmount
        );
        require(refundSuccess, "WSOM: Hoan tra tien ky quy ve CTM that bai, viec huy bi hoan tac");

        currentOrder.status = _newStatus;
        currentOrder.fundsEscrowed = false; // Mark funds as no longer escrowed for this order
        currentOrder.lastUpdateTimestamp = block.timestamp;

        // Specific event will be emitted by the calling public cancel function
        emit WSOrderStatusUpdated(_wsOrderId, currentOrder.status, block.timestamp);
    }

    function cancelOrderByWarehouse(uint256 _wsOrderId, string calldata _reason)
        external
        onlyOrderWarehouseManager(_wsOrderId)
        nonReentrant
    {
        _internalCancelOrder(_wsOrderId, WSOrderStatus.CancelledByWarehouse, msg.sender);
        emit WSOrderCancelledByWarehouse(_wsOrderId, msg.sender, _reason);
    }

    function cancelOrderBySupplier(uint256 _wsOrderId, string calldata _reason)
        external
        onlyOrderSupplier(_wsOrderId)
        nonReentrant
    {
        _internalCancelOrder(_wsOrderId, WSOrderStatus.CancelledBySupplier, msg.sender);
        emit WSOrderCancelledBySupplier(_wsOrderId, msg.sender, _reason);
    }

    // --- VIEW FUNCTIONS ---
    function getWSOrderDetails(uint256 _wsOrderId) external view returns (WSOrder memory) {
        require(wsOrders[_wsOrderId].wsOrderId != 0, "WSOM: Don hang khong tim thay");
        return wsOrders[_wsOrderId];
    }

    function getWarehouseSentOrders(address _warehouseAddress) external view returns (uint256[] memory) {
        return warehouseSentOrderIds[_warehouseAddress];
    }

    function getSupplierReceivedOrders(address _supplierAddress) external view returns (uint256[] memory) {
        return supplierReceivedOrderIds[_supplierAddress];
    }
}