// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./Interfaces.sol";      // Import file Interfaces.sol tập trung
import "./ItemsBasicManagement.sol"; // Import ItemsBasicManagement để hiểu các struct như PhysicalLocationInfo
import "./SuppliersManagement.sol"; // Import SuppliersManagement để hiểu các struct như SupplierInfo

// Hợp đồng Quản lý Ngân quỹ Công ty
contract CompanyTreasuryManager is Ownable, ReentrancyGuard {
    // Sử dụng các interface từ Interfaces.sol
    IRoleManagement public immutable roleManagement;
    IItemsBasicManagementInterface public immutable itemsManagement;
    ISuppliersManagementInterface public immutable suppliersManagement;

    address public roleManagementFullAddress; // Địa chỉ đầy đủ của RoleManagement cho việc kích hoạt BĐH
    address public warehouseSupplierOrderManagement;
    address public customerOrderManagementAddress;

    address public financeDirector;

    // Constants for internal transfers and spending limits
    uint256 public constant INTERNAL_ROLE_TOP_UP_THRESHOLD = 20 ether;
    uint256 public constant INTERNAL_ROLE_TOP_UP_AMOUNT = 5 ether;
    uint256 public constant WAREHOUSE_SPENDING_LIMIT_PER_PERIOD = 100 ether;

    // Mappings for spending policies and escrow
    mapping(address => mapping(address => uint256)) public warehouseSpendingPolicies; // warehouse => supplier => maxAmountPerOrder
    mapping(address => uint256) public warehouseSpendingThisPeriod; // warehouse => currentSpendingInPeriod

    struct EscrowDetails {
        address warehouseAddress;
        address supplierAddress;
        uint256 amount;
        bool active;
    }
    mapping(string => EscrowDetails) public activeEscrows; // internalSupplierOrderId => EscrowDetails

    // --- EVENTS ---
    event FundsDeposited(address indexed from, uint256 amount);
    event InitialCapitalReceived(uint256 amount);
    event BoardMemberContributionReceived(address indexed candidate, uint256 amount);
    event InternalTransfer(address indexed by, address indexed toRoleHolder, uint256 amount);
    event SupplierPaymentEscrowed(string internalOrderId, address indexed warehouse, address indexed supplier, uint256 amount);
    event SupplierPaymentReleased(string internalOrderId, address indexed supplier, uint256 amount);
    event EscrowRefunded(string internalOrderId, address indexed warehouse, uint256 amount);
    event SpendingPolicySet(address indexed setBy, address indexed warehouse, address indexed supplier, uint256 maxAmount);
    event FinanceDirectorSet(address indexed newDirector);
    event RoleManagementFullAddressSet(address indexed rmFullAddress); // Though set in constructor now, event is good practice
    event WarehouseSupplierOrderManagementAddressSet(address indexed wsomAddress);
    event CustomerOrderManagementAddressSet(address indexed comAddress);
    event GeneralWithdrawal(address indexed by, address indexed recipient, uint256 amount, string reason);
    event CustomerRefundProcessedFromTreasury(uint256 indexed orderId, address indexed customer, uint256 amount);

    // --- MODIFIERS ---
    modifier onlyFinanceDirector() {
        require(msg.sender == financeDirector, "CTM: Nguoi goi khong phai Giam doc Tai chinh");
        _;
    }

    // --- CONSTRUCTOR ---
    constructor(
        address _roleManagementAddress,
        address _itemsManagementAddress,
        address _suppliersManagementAddress,
        uint256 _expectedInitialCapital
    ) Ownable() payable { // Ownable() constructor doesn't take arguments in OZ 4.x+
        require(_roleManagementAddress != address(0), "CTM: Dia chi RoleManagement khong hop le");
        require(_itemsManagementAddress != address(0), "CTM: Dia chi ItemsManagement khong hop le");
        require(_suppliersManagementAddress != address(0), "CTM: Dia chi SuppliersManagement khong hop le");
        require(_expectedInitialCapital >= 0, "CTM: Von ban dau du kien khong the am");

        roleManagement = IRoleManagement(_roleManagementAddress);
        itemsManagement = IItemsBasicManagementInterface(_itemsManagementAddress);
        suppliersManagement = ISuppliersManagementInterface(_suppliersManagementAddress);
        roleManagementFullAddress = _roleManagementAddress; // Store for board member activation

        if (_expectedInitialCapital > 0) {
            require(msg.value == _expectedInitialCapital, "CTM: So von ban dau gui khong chinh xac");
            emit InitialCapitalReceived(msg.value);
        } else {
            require(msg.value == 0, "CTM: Khong nen gui Ether neu von ban dau du kien la 0");
        }
    }

    // --- SETTER FUNCTIONS (Owner controlled) ---
    function setWarehouseSupplierOrderManagementAddress(address _wsomAddress) external onlyOwner {
        require(_wsomAddress != address(0), "CTM: Dia chi WSOM khong hop le");
        warehouseSupplierOrderManagement = _wsomAddress;
        emit WarehouseSupplierOrderManagementAddressSet(_wsomAddress);
    }

    function setCustomerOrderManagementAddress(address _comAddress) external onlyOwner {
        require(_comAddress != address(0), "CTM: Dia chi COM khong hop le");
        customerOrderManagementAddress = _comAddress;
        emit CustomerOrderManagementAddressSet(_comAddress);
    }

    function setInitialFinanceDirector(address _director) external onlyOwner {
        require(_director != address(0), "CTM: Dia chi Giam doc khong the la zero");
        bytes32 finDirectorRole = roleManagement.FINANCE_DIRECTOR_ROLE();
        require(roleManagement.hasRole(finDirectorRole, _director), "CTM: Dia chi duoc gan thieu vai tro FIN_DIRECTOR_ROLE");
        require(financeDirector == address(0), "CTM: Giam doc Tai chinh ban dau da duoc thiet lap"); // Can only set once initially
        financeDirector = _director;
        emit FinanceDirectorSet(_director);
    }

    // --- RECEIVE ETHER ---
    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value);
    }

    // --- CORE TREASURY FUNCTIONS ---

    // Called by Finance Director to top-up internal roles
    function transferToInternalRole(address _roleHolderAddress, bytes32 _roleKey)
        external
        onlyFinanceDirector
        nonReentrant
    {
        require(_roleHolderAddress != address(0), "CTM: Dia chi nguoi giu vai tro khong the la zero");
        require(roleManagement.hasRole(_roleKey, _roleHolderAddress), "CTM: Dia chi muc tieu khong co vai tro duoc chi dinh");

        bytes32 finDirectorRole = roleManagement.FINANCE_DIRECTOR_ROLE();
        require(_roleKey != finDirectorRole, "CTM: Khong the nap tien cho vai tro Giam doc Tai chinh theo cach nay");

        uint256 targetBalance = _roleHolderAddress.balance;
        require(targetBalance < INTERNAL_ROLE_TOP_UP_THRESHOLD, "CTM: So du cua nguoi giu vai tro muc tieu khong duoi nguong");

        uint256 amountToSend = INTERNAL_ROLE_TOP_UP_AMOUNT;
        require(address(this).balance >= amountToSend, "CTM: Ngan quy khong du tien");

        (bool success, ) = payable(_roleHolderAddress).call{value: amountToSend}("");
        require(success, "CTM: Chuyen tien noi bo that bai");
        emit InternalTransfer(msg.sender, _roleHolderAddress, amountToSend);
    }

    // Called by Finance Director to set spending policies
    function setWarehouseSpendingPolicy(
        address _warehouseAddress,
        address _supplierAddress,
        uint256 _maxAmountPerOrder
    ) external onlyFinanceDirector {
        require(_warehouseAddress != address(0), "CTM: Dia chi kho khong the la zero");
        require(_supplierAddress != address(0), "CTM: Dia chi NCC khong the la zero");

        // itemsManagement.getWarehouseInfo returns ItemsManagement.PhysicalLocationInfo
        // We imported ItemsManagement.sol, so the compiler knows this struct.
        PhysicalLocationInfo memory whInfo = itemsManagement.getWarehouseInfo(_warehouseAddress);
        require(whInfo.exists, "CTM: Kho khong ton tai trong IM");

        SupplierInfo memory supInfo = suppliersManagement.getSupplierInfo(_supplierAddress);
        require(supInfo.exists && supInfo.isApprovedByBoard, "CTM: NCC khong ton tai hoac chua duoc phe duyet trong IM");


        warehouseSpendingPolicies[_warehouseAddress][_supplierAddress] = _maxAmountPerOrder;
        emit SpendingPolicySet(msg.sender, _warehouseAddress, _supplierAddress, _maxAmountPerOrder);
    }

    // Called by Finance Director for general withdrawals
    function generalWithdrawal(address payable _recipient, uint256 _amount, string calldata _reason)
        external
        onlyFinanceDirector
        nonReentrant
    {
        require(_recipient != address(0), "CTM: Nguoi nhan khong the la dia chi zero");
        require(_amount > 0, "CTM: So tien phai la so duong");
        require(address(this).balance >= _amount, "CTM: Ngan quy khong du tien");

        (bool success, ) = _recipient.call{value: _amount}("");
        require(success, "CTM: Rut tien chung that bai");
        emit GeneralWithdrawal(msg.sender, _recipient, _amount, _reason);
    }

    // Called by Owner to change the Finance Director
    function changeFinanceDirector(address _newDirector) external onlyOwner {
        require(_newDirector != address(0), "CTM: Giam doc moi khong the la dia chi zero");
        bytes32 finDirectorRole = roleManagement.FINANCE_DIRECTOR_ROLE();
        require(roleManagement.hasRole(finDirectorRole, _newDirector), "CTM: Giam doc moi thieu vai tro FIN_DIRECTOR_ROLE");
        require(_newDirector != financeDirector, "CTM: Giam doc moi trung voi giam doc hien tai");
        financeDirector = _newDirector;
        emit FinanceDirectorSet(_newDirector);
    }

    // --- ESCROW FUNCTIONS (Called by WarehouseSupplierOrderManagement) ---
    function requestEscrowForSupplierOrder(
        address _warehouseAddress,
        address _supplierAddress,
        string calldata _internalSupplierOrderId,
        uint256 _amount
    ) external nonReentrant returns (bool) {
        require(msg.sender == warehouseSupplierOrderManagement, "CTM: Nguoi goi khong phai WSOM");
        require(_warehouseAddress != address(0), "CTM: Dia chi kho ky quy khong the la zero");
        require(_supplierAddress != address(0), "CTM: Dia chi NCC ky quy khong the la zero");
        require(bytes(_internalSupplierOrderId).length > 0, "CTM: ID don hang ky quy khong duoc rong");
        require(_amount > 0, "CTM: So tien ky quy phai la so duong");
        require(!activeEscrows[_internalSupplierOrderId].active, "CTM: ID ky quy da kich hoat hoac khong hop le");

        uint256 maxAmountAllowed = warehouseSpendingPolicies[_warehouseAddress][_supplierAddress];
        require(maxAmountAllowed > 0, "CTM: Khong co chinh sach chi tieu cho kho/ncc nay");
        require(_amount <= maxAmountAllowed, "CTM: So tien vuot qua gioi han chinh sach moi don hang");

        uint256 spendingAfterThisOrder = warehouseSpendingThisPeriod[_warehouseAddress] + _amount;
        require(spendingAfterThisOrder <= WAREHOUSE_SPENDING_LIMIT_PER_PERIOD, "CTM: Vuot qua gioi han chi tieu dinh ky cua kho");
        require(address(this).balance >= _amount, "CTM: Ngan quy khong du tien de ky quy");

        activeEscrows[_internalSupplierOrderId] = EscrowDetails({
            warehouseAddress: _warehouseAddress,
            supplierAddress: _supplierAddress,
            amount: _amount,
            active: true
        });
        warehouseSpendingThisPeriod[_warehouseAddress] = spendingAfterThisOrder; // Update spending for the period
        emit SupplierPaymentEscrowed(_internalSupplierOrderId, _warehouseAddress, _supplierAddress, _amount);
        return true;
    }

    function releaseEscrowToSupplier(
        address _supplierAddressToVerify,
        string calldata _internalSupplierOrderId,
        uint256 _amountToVerify
    ) external nonReentrant returns (bool) {
        require(msg.sender == warehouseSupplierOrderManagement, "CTM: Nguoi goi khong phai WSOM");
        require(_supplierAddressToVerify != address(0), "CTM: Dia chi NCC khong the la zero de giai ngan");
        require(bytes(_internalSupplierOrderId).length > 0, "CTM: ID don hang khong duoc rong de giai ngan");

        EscrowDetails storage escrow = activeEscrows[_internalSupplierOrderId];
        require(escrow.active, "CTM: Ky quy khong kich hoat hoac khong tim thay de giai ngan");
        require(escrow.supplierAddress == _supplierAddressToVerify, "CTM: NCC khong khop de giai ngan");
        require(escrow.amount == _amountToVerify, "CTM: So tien khong khop de giai ngan");

        escrow.active = false; // Mark as inactive before transfer
        (bool success, ) = payable(escrow.supplierAddress).call{value: escrow.amount}("");
        if (!success) {
            escrow.active = true; // Revert state if transfer fails
            return false; // Indicate failure
        }
        // warehouseSpendingThisPeriod is NOT reduced here, as the money has been spent
        emit SupplierPaymentReleased(_internalSupplierOrderId, escrow.supplierAddress, escrow.amount);
        return true;
    }

    function refundEscrowToTreasury( // Called when an order is cancelled before payment release
        address _warehouseAddressToVerify,
        string calldata _internalSupplierOrderId,
        uint256 _amountToVerify
    ) external nonReentrant returns (bool) {
        require(msg.sender == warehouseSupplierOrderManagement, "CTM: Nguoi goi khong phai WSOM");
        require(_warehouseAddressToVerify != address(0), "CTM: Dia chi kho khong the la zero de hoan tra");
        require(bytes(_internalSupplierOrderId).length > 0, "CTM: ID don hang khong duoc rong de hoan tra");

        EscrowDetails storage escrow = activeEscrows[_internalSupplierOrderId];
        require(escrow.active, "CTM: Ky quy khong kich hoat hoac khong tim thay de hoan tra");
        require(escrow.warehouseAddress == _warehouseAddressToVerify, "CTM: Kho khong khop de hoan tra");
        require(escrow.amount == _amountToVerify, "CTM: So tien khong khop de hoan tra");

        escrow.active = false;
        // Refund the spending amount back to the period's allowance
        warehouseSpendingThisPeriod[escrow.warehouseAddress] -= escrow.amount;
        emit EscrowRefunded(_internalSupplierOrderId, escrow.warehouseAddress, escrow.amount);
        return true;
    }

    // --- CUSTOMER REFUND (Called by CustomerOrderManagement) ---
    function refundCustomerOrderFromTreasury(
        uint256 _orderId,
        address payable _customerAddress,
        uint256 _amountToRefund
    )
        external
        nonReentrant
    {
        require(msg.sender == customerOrderManagementAddress, "CTM: Chi COM moi duoc yeu cau hoan tien nay");
        require(_customerAddress != address(0), "CTM: Dia chi khach hang khong hop le de hoan tien");
        require(_amountToRefund > 0, "CTM: So tien hoan phai lon hon 0");
        require(address(this).balance >= _amountToRefund, "CTM: Ngan quy khong du tien de hoan");

        (bool success, ) = _customerAddress.call{value: _amountToRefund}("");
        require(success, "CTM: Hoan tien cho khach tu ngan quy that bai");

        emit CustomerRefundProcessedFromTreasury(_orderId, _customerAddress, _amountToRefund);
    }

    // --- BOARD MEMBER CONTRIBUTION (Called directly by board candidates) ---
    function receiveBoardMemberContribution() external payable nonReentrant {
        address candidate = msg.sender;
        uint256 amountContributed = msg.value;

        require(roleManagementFullAddress != address(0), "CTM: Dia chi RoleManagement day du chua duoc thiet lap");

        // Use IRoleManagement from Interfaces.sol
        uint256 proposedCapital = IRoleManagement(roleManagementFullAddress).getProposedShareCapital(candidate);

        require(proposedCapital > 0, "CTM: Khong co de xuat von cho ung vien nay hoac RoleManagement chua san sang");
        require(amountContributed == proposedCapital, "CTM: So tien gop khong dung voi de xuat von");

        // Ether is already in this contract's balance due to `payable`
        emit BoardMemberContributionReceived(candidate, amountContributed);

        // Call back to RoleManagement to activate the member
        IRoleManagement(roleManagementFullAddress).activateBoardMemberByTreasury(candidate, amountContributed);
    }

    // --- VIEW FUNCTIONS ---
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getWarehouseSpendingPolicy(address _warehouseAddress, address _supplierAddress) external view returns (uint256) {
        return warehouseSpendingPolicies[_warehouseAddress][_supplierAddress];
    }

    function getWarehouseSpendingThisPeriod(address _warehouseAddress) external view returns (uint256) {
        return warehouseSpendingThisPeriod[_warehouseAddress];
    }

    function getEscrowDetails(string calldata _internalSupplierOrderId) external view returns (EscrowDetails memory) {
        return activeEscrows[_internalSupplierOrderId];
    }

    // --- CONSTANT GETTERS (useful for front-end or other contracts to know limits) ---
    function WAREHOUSE_SPENDING_LIMIT_PER_PERIOD_CONST() external pure returns (uint256) {
        return WAREHOUSE_SPENDING_LIMIT_PER_PERIOD;
    }
    function INTERNAL_ROLE_TOP_UP_THRESHOLD_CONST() external pure returns (uint256) {
        return INTERNAL_ROLE_TOP_UP_THRESHOLD;
    }
    function INTERNAL_ROLE_TOP_UP_AMOUNT_CONST() external pure returns (uint256) {
        return INTERNAL_ROLE_TOP_UP_AMOUNT;
    }
}