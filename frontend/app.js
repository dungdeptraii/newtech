// Global variables
let web3;
let accounts = [];
let currentAccount = null;

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize the application
async function initializeApp() {
    try {
        // Check if Web3 is available
        if (typeof window.ethereum !== 'undefined') {
            console.log('MetaMask is installed!');
            web3 = new Web3(window.ethereum);
        } else {
            console.log('MetaMask is not installed');
            showAlert('error', 'MetaMask không được cài đặt. Vui lòng cài đặt MetaMask để sử dụng ứng dụng này.');
            return;
        }        // Validate that contract functions are available
        if (typeof window.getContract !== 'function') {
            console.error('getContract function is not available');
            showAlert('error', 'Lỗi tải hợp đồng thông minh. Vui lòng tải lại trang.');
            return;
        }

        console.log('Contract functions loaded successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
        showAlert('error', 'Lỗi khởi tạo ứng dụng: ' + error.message);
    }

    // Setup event listeners
    setupEventListeners();
    
    // Check if already connected
    try {
        accounts = await web3.eth.getAccounts();
        if (accounts.length > 0) {
            currentAccount = accounts[0];
            updateConnectionStatus(true);
        }
    } catch (error) {
        console.error('Error checking connection:', error);
    }
}

// Setup event listeners
function setupEventListeners() {    document.getElementById('connectBtn').addEventListener('click', connectWallet);
    document.getElementById('disconnectBtn').addEventListener('click', disconnectWallet);
    document.getElementById('switchNetworkBtn').addEventListener('click', switchToCorrectNetwork);
    document.getElementById('testContractsBtn').addEventListener('click', testAllContracts);
    document.getElementById('networkSelect').addEventListener('change', handleNetworkChange);
    
    // Listen for account changes
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', function(accounts) {
            if (accounts.length === 0) {
                updateConnectionStatus(false);
            } else {
                currentAccount = accounts[0];
                updateConnectionStatus(true);
            }        });
        
        // Listen for network changes
        window.ethereum.on('chainChanged', function(chainId) {
            console.log('Network changed to:', chainId);
            updateConnectionStatus(true);
            updateNetworkStatus();
            checkContractAddresses();
        });
    }
    
    // Initialize network status
    updateNetworkStatus();
    checkContractAddresses();
}

// Connect wallet
async function connectWallet() {
    try {
        showLoading(true);
        
        // Request account access
        accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        
        currentAccount = accounts[0];
        updateConnectionStatus(true);
        
        showAlert('success', 'Kết nối ví thành công!');
    } catch (error) {
        console.error('Error connecting wallet:', error);
        showAlert('error', 'Lỗi kết nối ví: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Disconnect wallet
function disconnectWallet() {
    currentAccount = null;
    accounts = [];
    updateConnectionStatus(false);
    showAlert('info', 'Đã ngắt kết nối ví');
}

// Handle network change from select dropdown
async function handleNetworkChange() {
    const networkSelect = document.getElementById('networkSelect');
    const selectedNetwork = networkSelect.value;
    
    let networkConfig;
    switch(selectedNetwork) {
        case 'ganache':
            networkConfig = NETWORK_CONFIG.GANACHE;
            break;
        case 'sepolia':
            networkConfig = NETWORK_CONFIG.SEPOLIA;
            break;
        case 'mumbai':
            networkConfig = NETWORK_CONFIG.MUMBAI;
            break;
        default:
            networkConfig = NETWORK_CONFIG.GANACHE;
    }
    
    try {
        showLoading(true);
        await switchToNetwork(networkConfig);
        showAlert('success', `Đã chuyển sang mạng ${networkConfig.chainName}!`);
        updateNetworkStatus();
        checkContractAddresses();
    } catch (error) {
        console.error('Error switching network:', error);
        showAlert('error', 'Lỗi khi chuyển mạng: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Switch to correct network
async function switchToCorrectNetwork() {
    try {
        showLoading(true);
        await switchToNetwork(CURRENT_NETWORK);
        showAlert('success', 'Đã chuyển mạng thành công!');
        updateNetworkStatus();
    } catch (error) {
        console.error('Error switching network:', error);
        showAlert('error', 'Lỗi khi chuyển mạng: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Update network status
async function updateNetworkStatus() {
    try {
        const chainId = await web3.eth.getChainId();
        const networkElement = document.getElementById('currentNetwork');
        const switchBtn = document.getElementById('switchNetworkBtn');
        
        let networkName = 'Unknown';
        let isCorrectNetwork = false;
        
        switch(chainId) {
            case 5777:
                networkName = 'Ganache Local';
                isCorrectNetwork = true;
                break;
            case 11155111:
                networkName = 'Sepolia Testnet';
                break;
            case 80001:
                networkName = 'Polygon Mumbai';
                break;
            default:
                networkName = `Chain ID: ${chainId}`;
        }
        
        networkElement.textContent = networkName;
        
        if (currentAccount) {
            if (isCorrectNetwork) {
                switchBtn.style.display = 'none';
            } else {
                switchBtn.style.display = 'inline-block';
            }
        }
        
    } catch (error) {
        console.error('Error getting network info:', error);
    }
}

// Update connection status UI
function updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connectionStatus');
    const addressElement = document.getElementById('accountAddress');
    const connectBtn = document.getElementById('connectBtn');
    const disconnectBtn = document.getElementById('disconnectBtn');
    const switchBtn = document.getElementById('switchNetworkBtn');
    const testBtn = document.getElementById('testContractsBtn');
    
    if (connected && currentAccount) {
        statusElement.innerHTML = '<i class="fas fa-circle text-success me-1"></i>Đã kết nối';
        addressElement.textContent = `Địa chỉ: ${currentAccount.substring(0, 6)}...${currentAccount.substring(38)}`;
        connectBtn.style.display = 'none';
        disconnectBtn.style.display = 'inline-block';
        testBtn.style.display = 'inline-block';
        updateNetworkStatus(); // Update network status when connected
    } else {
        statusElement.innerHTML = '<i class="fas fa-circle text-danger me-1"></i>Chưa kết nối';
        addressElement.textContent = 'Địa chỉ: Chưa kết nối';
        connectBtn.style.display = 'inline-block';
        disconnectBtn.style.display = 'none';
        switchBtn.style.display = 'none';
        testBtn.style.display = 'none';
        document.getElementById('currentNetwork').textContent = 'Chưa kết nối';
    }
}

// Show loading modal
function showLoading(show) {
    const modal = new bootstrap.Modal(document.getElementById('loadingModal'));
    if (show) {
        modal.show();
    } else {
        modal.hide();
    }
}

// Show alert
function showAlert(type, message) {
    const alertClass = type === 'success' ? 'result-success' : 
                     type === 'error' ? 'result-error' : 'result-info';
    
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = alertClass;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
        ${message}
    `;
    
    // Add to page (you can customize where to show this)
    document.body.insertBefore(alertDiv, document.body.firstChild);
    
    // Remove after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Check if wallet is connected
function checkWalletConnection() {
    if (!currentAccount) {
        showAlert('error', 'Vui lòng kết nối ví trước khi thực hiện giao dịch');
        return false;
    }
    return true;
}

// Role Management Functions
async function checkRole() {
    if (!checkWalletConnection()) return;
    
    try {
        showLoading(true);
        
        const address = document.getElementById('checkRoleAddress').value;
        const roleType = document.getElementById('roleSelect').value;
        
        if (!address) {
            showAlert('error', 'Vui lòng nhập địa chỉ cần kiểm tra');
            return;
        }
        
        if (!web3.utils.isAddress(address)) {        showAlert('error', 'Địa chỉ không hợp lệ');
            return;
        }
        
        const roleContract = window.getContract('ROLE_MANAGEMENT');
        
        // Get role hash
        const roleHash = await roleContract.methods[roleType]().call();
        
        // Check if address has role
        const hasRole = await roleContract.methods.hasRole(roleHash, address).call();
        
        const resultDiv = document.getElementById('roleResult');
        resultDiv.className = hasRole ? 'result-success' : 'result-info';
        resultDiv.innerHTML = `
            <strong>Kết quả kiểm tra vai trò:</strong><br>
            Địa chỉ: ${address}<br>
            Vai trò: ${roleType}<br>
            Trạng thái: ${hasRole ? 'Có vai trò' : 'Không có vai trò'}
        `;
        
    } catch (error) {
        console.error('Error checking role:', error);
        showAlert('error', 'Lỗi kiểm tra vai trò: ' + error.message);
    } finally {
        showLoading(false);
    }
}

async function grantRole() {
    if (!checkWalletConnection()) return;
    
    try {
        showLoading(true);
          const address = document.getElementById('grantRoleAddress').value;
        const roleType = document.getElementById('grantRoleSelect').value;
        
        if (!address) {
            showAlert('error', 'Vui lòng nhập địa chỉ nhận vai trò');
            return;
        }
        
        if (!web3.utils.isAddress(address)) {
            showAlert('error', 'Địa chỉ không hợp lệ');
            return;
        }
        
        const roleContract = window.getContract('ROLE_MANAGEMENT');
        
        // Get role hash
        const roleHash = await roleContract.methods[roleType]().call();
        
        // Grant role
        const tx = await roleContract.methods.grantRole(roleHash, address).send({
            from: currentAccount
        });
        
        const resultDiv = document.getElementById('grantRoleResult');
        resultDiv.className = 'result-success';
        resultDiv.innerHTML = `
            <strong>Cấp vai trò thành công!</strong><br>
            Địa chỉ: ${address}<br>
            Vai trò: ${roleType}<br>
            TX Hash: <span class="transaction-hash">${tx.transactionHash}</span>
        `;
        
    } catch (error) {
        console.error('Error granting role:', error);
        showAlert('error', 'Lỗi cấp vai trò: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Items Management Functions
async function getLocationInfo() {
    if (!checkWalletConnection()) return;
    
    try {
        showLoading(true);
        
        const address = document.getElementById('locationAddress').value;
        const type = document.getElementById('locationType').value;
        
        if (!address) {
            showAlert('error', 'Vui lòng nhập địa chỉ');
            return;
        }
        
        if (!web3.utils.isAddress(address)) {
            showAlert('error', 'Địa chỉ không hợp lệ');        return;
        }
        
        const itemsContract = window.getContract('ITEMS_BASIC_MANAGEMENT');
        
        let locationInfo;
        if (type === 'warehouse') {
            locationInfo = await itemsContract.methods.getWarehouseInfo(address).call();
        } else {
            locationInfo = await itemsContract.methods.getStoreInfo(address).call();
        }
        
        const resultDiv = document.getElementById('locationResult');
        resultDiv.className = 'result-success';
        resultDiv.innerHTML = `
            <strong>Thông tin ${type === 'warehouse' ? 'Kho' : 'Cửa hàng'}:</strong><br>
            Tên: ${locationInfo.name}<br>
            Địa điểm: ${locationInfo.location}<br>
            Trạng thái: ${locationInfo.isActive ? 'Hoạt động' : 'Không hoạt động'}
        `;
        
    } catch (error) {
        console.error('Error getting location info:', error);
        showAlert('error', 'Lỗi lấy thông tin: ' + error.message);
    } finally {
        showLoading(false);
    }
}

async function getItemPrice() {
    if (!checkWalletConnection()) return;
    
    try {
        showLoading(true);
        
        const itemId = document.getElementById('itemId').value;
        const storeAddress = document.getElementById('storeAddress').value;
        
        if (!itemId || !storeAddress) {
            showAlert('error', 'Vui lòng nhập đầy đủ thông tin');
            return;
        }
        
        if (!web3.utils.isAddress(storeAddress)) {
            showAlert('error', 'Địa chỉ cửa hàng không hợp lệ');
            return;        }
        
        const itemsContract = window.getContract('ITEMS_BASIC_MANAGEMENT');
        
        const priceInfo = await itemsContract.methods.getItemRetailPriceAtStore(itemId, storeAddress).call();
        
        const resultDiv = document.getElementById('priceResult');
        if (priceInfo.priceExists) {
            resultDiv.className = 'result-success';
            resultDiv.innerHTML = `
                <strong>Thông tin giá sản phẩm:</strong><br>
                Mã sản phẩm: ${itemId}<br>
                Cửa hàng: ${storeAddress}<br>
                Giá: ${web3.utils.fromWei(priceInfo.price, 'ether')} ETH
            `;
        } else {
            resultDiv.className = 'result-info';
            resultDiv.innerHTML = `
                <strong>Không tìm thấy giá:</strong><br>
                Sản phẩm ${itemId} chưa có giá tại cửa hàng này
            `;
        }
        
    } catch (error) {
        console.error('Error getting item price:', error);
        showAlert('error', 'Lỗi lấy thông tin giá: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Suppliers Management Functions
async function getSupplierInfo() {
    if (!checkWalletConnection()) return;
    
    try {
        showLoading(true);
        
        const supplierAddress = document.getElementById('supplierAddress').value;
        
        if (!supplierAddress) {
            showAlert('error', 'Vui lòng nhập địa chỉ nhà cung cấp');
            return;
        }
        
        if (!web3.utils.isAddress(supplierAddress)) {        showAlert('error', 'Địa chỉ không hợp lệ');
            return;
        }
        
        const suppliersContract = window.getContract('SUPPLIERS_MANAGEMENT');
        
        const supplierInfo = await suppliersContract.methods.getSupplierInfo(supplierAddress).call();
        
        const resultDiv = document.getElementById('supplierResult');
        if (supplierInfo.exists) {
            resultDiv.className = 'result-success';
            resultDiv.innerHTML = `
                <strong>Thông tin Nhà cung cấp:</strong><br>
                ID: ${supplierInfo.supplierId}<br>
                Tên: ${supplierInfo.name}<br>
                Được phê duyệt: ${supplierInfo.isApprovedByBoard ? 'Có' : 'Không'}<br>
                Trạng thái: Tồn tại
            `;
        } else {
            resultDiv.className = 'result-info';
            resultDiv.innerHTML = `
                <strong>Không tìm thấy nhà cung cấp</strong><br>
                Địa chỉ ${supplierAddress} chưa được đăng ký
            `;
        }
        
    } catch (error) {
        console.error('Error getting supplier info:', error);
        showAlert('error', 'Lỗi lấy thông tin nhà cung cấp: ' + error.message);
    } finally {
        showLoading(false);
    }
}

async function getSupplierItemDetails() {
    if (!checkWalletConnection()) return;
    
    try {
        showLoading(true);
        
        const supplierAddress = document.getElementById('supplierItemAddress').value;
        const itemId = document.getElementById('supplierItemId').value;
        
        if (!supplierAddress || !itemId) {
            showAlert('error', 'Vui lòng nhập đầy đủ thông tin');
            return;
        }
          if (!web3.utils.isAddress(supplierAddress)) {
            showAlert('error', 'Địa chỉ nhà cung cấp không hợp lệ');
            return;
        }
        
        const suppliersContract = window.getContract('SUPPLIERS_MANAGEMENT');
        
        const itemDetails = await suppliersContract.methods.getSupplierItemDetails(supplierAddress, itemId).call();
        
        const resultDiv = document.getElementById('supplierItemResult');
        if (itemDetails.isAvailable) {
            resultDiv.className = 'result-success';
            resultDiv.innerHTML = `
                <strong>Chi tiết Sản phẩm:</strong><br>
                Mã sản phẩm: ${itemDetails.itemId}<br>
                Giá/đơn vị: ${web3.utils.fromWei(itemDetails.pricePerUnit, 'ether')} ETH<br>
                Số lượng khả dụng: ${itemDetails.availableQuantity}<br>
                Trạng thái: Có sẵn
            `;
        } else {
            resultDiv.className = 'result-info';
            resultDiv.innerHTML = `
                <strong>Sản phẩm không khả dụng</strong><br>
                Sản phẩm ${itemId} hiện không có sẵn từ nhà cung cấp này
            `;
        }
        
    } catch (error) {
        console.error('Error getting supplier item details:', error);
        showAlert('error', 'Lỗi lấy chi tiết sản phẩm: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Warehouse Management Functions
async function requestStockTransfer() {
    if (!checkWalletConnection()) return;
    
    try {
        showLoading(true);
        
        const storeAddress = document.getElementById('transferStoreAddress').value;
        const warehouseAddress = document.getElementById('transferWarehouseAddress').value;
        const itemId = document.getElementById('transferItemId').value;
        const quantity = document.getElementById('transferQuantity').value;
        
        if (!storeAddress || !warehouseAddress || !itemId || !quantity) {
            showAlert('error', 'Vui lòng nhập đầy đủ thông tin');
            return;
        }
          if (!web3.utils.isAddress(storeAddress) || !web3.utils.isAddress(warehouseAddress)) {
            showAlert('error', 'Địa chỉ không hợp lệ');
            return;
        }
        
        const warehouseContract = window.getContract('WAREHOUSE_INVENTORY_MANAGEMENT');
        
        const tx = await warehouseContract.methods.requestStockTransferToStore(
            currentAccount,
            storeAddress,
            warehouseAddress,
            itemId,
            quantity
        ).send({
            from: currentAccount
        });
        
        const resultDiv = document.getElementById('transferResult');
        resultDiv.className = 'result-success';
        resultDiv.innerHTML = `
            <strong>Yêu cầu chuyển hàng thành công!</strong><br>
            Từ kho: ${warehouseAddress}<br>
            Đến cửa hàng: ${storeAddress}<br>
            Sản phẩm: ${itemId}<br>
            Số lượng: ${quantity}<br>
            TX Hash: <span class="transaction-hash">${tx.transactionHash}</span>
        `;
        
    } catch (error) {
        console.error('Error requesting stock transfer:', error);
        showAlert('error', 'Lỗi yêu cầu chuyển hàng: ' + error.message);
    } finally {
        showLoading(false);
    }
}

async function recordStockInFromSupplier() {
    if (!checkWalletConnection()) return;
    
    try {
        showLoading(true);
        
        const warehouseAddress = document.getElementById('stockInWarehouseAddress').value;
        const itemId = document.getElementById('stockInItemId').value;
        const quantity = document.getElementById('stockInQuantity').value;
        const orderId = document.getElementById('stockInOrderId').value;
        
        if (!warehouseAddress || !itemId || !quantity || !orderId) {
            showAlert('error', 'Vui lòng nhập đầy đủ thông tin');
            return;
        }
          if (!web3.utils.isAddress(warehouseAddress)) {
            showAlert('error', 'Địa chỉ kho không hợp lệ');
            return;
        }
        
        const warehouseContract = window.getContract('WAREHOUSE_INVENTORY_MANAGEMENT');
        
        const tx = await warehouseContract.methods.recordStockInFromSupplier(
            warehouseAddress,
            itemId,
            quantity,
            orderId
        ).send({
            from: currentAccount
        });
        
        const resultDiv = document.getElementById('stockInResult');
        resultDiv.className = 'result-success';
        resultDiv.innerHTML = `
            <strong>Ghi nhận nhập kho thành công!</strong><br>
            Kho: ${warehouseAddress}<br>
            Sản phẩm: ${itemId}<br>
            Số lượng: ${quantity}<br>
            ID đơn hàng: ${orderId}<br>
            TX Hash: <span class="transaction-hash">${tx.transactionHash}</span>
        `;
        
    } catch (error) {
        console.error('Error recording stock in:', error);
        showAlert('error', 'Lỗi ghi nhận nhập kho: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Store Management Functions
async function getStoreStockLevel() {
    if (!checkWalletConnection()) return;
    
    try {
        showLoading(true);
        
        const storeAddress = document.getElementById('checkStockStoreAddress').value;
        const itemId = document.getElementById('checkStockItemId').value;
        
        if (!storeAddress || !itemId) {
            showAlert('error', 'Vui lòng nhập đầy đủ thông tin');
            return;
        }
        
        if (!web3.utils.isAddress(storeAddress)) {
            showAlert('error', 'Địa chỉ cửa hàng không hợp lệ');        return;
        }
        
        const storeContract = window.getContract('STORE_INVENTORY_MANAGEMENT');
        
        const stockLevel = await storeContract.methods.getStoreStockLevel(storeAddress, itemId).call();
        
        const resultDiv = document.getElementById('stockLevelResult');
        resultDiv.className = 'result-success';
        resultDiv.innerHTML = `
            <strong>Tồn kho Cửa hàng:</strong><br>
            Cửa hàng: ${storeAddress}<br>
            Sản phẩm: ${itemId}<br>
            Số lượng tồn: ${stockLevel}
        `;
        
    } catch (error) {
        console.error('Error getting store stock level:', error);
        showAlert('error', 'Lỗi kiểm tra tồn kho: ' + error.message);
    } finally {
        showLoading(false);
    }
}

async function confirmStockReceived() {
    if (!checkWalletConnection()) return;
    
    try {
        showLoading(true);
        
        const storeAddress = document.getElementById('confirmStoreAddress').value;
        const itemId = document.getElementById('confirmItemId').value;
        const quantity = document.getElementById('confirmQuantity').value;
        const fromWarehouse = document.getElementById('confirmFromWarehouse').value;
        const transferId = document.getElementById('confirmTransferId').value;
        
        if (!storeAddress || !itemId || !quantity || !fromWarehouse || !transferId) {
            showAlert('error', 'Vui lòng nhập đầy đủ thông tin');
            return;
        }
          if (!web3.utils.isAddress(storeAddress) || !web3.utils.isAddress(fromWarehouse)) {
            showAlert('error', 'Địa chỉ không hợp lệ');
            return;
        }
        
        const storeContract = window.getContract('STORE_INVENTORY_MANAGEMENT');
        
        const tx = await storeContract.methods.confirmStockReceivedFromWarehouse(
            storeAddress,
            itemId,
            quantity,
            fromWarehouse,
            transferId
        ).send({
            from: currentAccount
        });
        
        const resultDiv = document.getElementById('confirmResult');
        resultDiv.className = 'result-success';
        resultDiv.innerHTML = `
            <strong>Xác nhận nhận hàng thành công!</strong><br>
            Cửa hàng: ${storeAddress}<br>
            Sản phẩm: ${itemId}<br>
            Số lượng: ${quantity}<br>
            Từ kho: ${fromWarehouse}<br>
            TX Hash: <span class="transaction-hash">${tx.transactionHash}</span>
        `;
        
    } catch (error) {
        console.error('Error confirming stock received:', error);
        showAlert('error', 'Lỗi xác nhận nhận hàng: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Orders Management Functions
async function deductStockForSale() {
    if (!checkWalletConnection()) return;
    
    try {
        showLoading(true);
        
        const storeAddress = document.getElementById('saleStoreAddress').value;
        const itemId = document.getElementById('saleItemId').value;
        const quantity = document.getElementById('saleQuantity').value;
        const customerOrderId = document.getElementById('customerOrderId').value;
        
        if (!storeAddress || !itemId || !quantity || !customerOrderId) {
            showAlert('error', 'Vui lòng nhập đầy đủ thông tin');
            return;
        }
          if (!web3.utils.isAddress(storeAddress)) {
            showAlert('error', 'Địa chỉ cửa hàng không hợp lệ');
            return;
        }
        
        const storeContract = window.getContract('STORE_INVENTORY_MANAGEMENT');
        
        const tx = await storeContract.methods.deductStockForCustomerSale(
            storeAddress,
            itemId,
            quantity,
            customerOrderId
        ).send({
            from: currentAccount
        });
        
        const resultDiv = document.getElementById('saleResult');
        resultDiv.className = 'result-success';
        resultDiv.innerHTML = `
            <strong>Trừ hàng bán thành công!</strong><br>
            Cửa hàng: ${storeAddress}<br>
            Sản phẩm: ${itemId}<br>
            Số lượng: ${quantity}<br>
            ID đơn hàng: ${customerOrderId}<br>
            TX Hash: <span class="transaction-hash">${tx.transactionHash}</span>
        `;
        
    } catch (error) {
        console.error('Error deducting stock for sale:', error);
        showAlert('error', 'Lỗi trừ hàng bán: ' + error.message);
    } finally {
        showLoading(false);
    }
}

async function recordReturnedStock() {
    if (!checkWalletConnection()) return;
    
    try {
        showLoading(true);
        
        const warehouseAddress = document.getElementById('returnWarehouseAddress').value;
        const itemId = document.getElementById('returnItemId').value;
        const quantity = document.getElementById('returnQuantity').value;
        const customerOrderId = document.getElementById('returnCustomerOrderId').value;
        
        if (!warehouseAddress || !itemId || !quantity || !customerOrderId) {
            showAlert('error', 'Vui lòng nhập đầy đủ thông tin');
            return;
        }
          if (!web3.utils.isAddress(warehouseAddress)) {
            showAlert('error', 'Địa chỉ kho không hợp lệ');
            return;
        }
        
        const warehouseContract = window.getContract('WAREHOUSE_INVENTORY_MANAGEMENT');
        
        const tx = await warehouseContract.methods.recordReturnedStockByCustomer(
            warehouseAddress,
            itemId,
            quantity,
            customerOrderId
        ).send({
            from: currentAccount
        });
        
        const resultDiv = document.getElementById('returnResult');
        resultDiv.className = 'result-success';
        resultDiv.innerHTML = `
            <strong>Ghi nhận trả hàng thành công!</strong><br>
            Kho nhận: ${warehouseAddress}<br>
            Sản phẩm: ${itemId}<br>
            Số lượng: ${quantity}<br>
            ID đơn hàng: ${customerOrderId}<br>
            TX Hash: <span class="transaction-hash">${tx.transactionHash}</span>
        `;
        
    } catch (error) {
        console.error('Error recording returned stock:', error);
        showAlert('error', 'Lỗi ghi nhận trả hàng: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Treasury Management Functions
async function requestEscrow() {
    if (!checkWalletConnection()) return;
    
    try {
        showLoading(true);
        
        const warehouseAddress = document.getElementById('escrowWarehouseAddress').value;
        const supplierAddress = document.getElementById('escrowSupplierAddress').value;
        const orderId = document.getElementById('escrowOrderId').value;
        const amount = document.getElementById('escrowAmount').value;
        
        if (!warehouseAddress || !supplierAddress || !orderId || !amount) {
            showAlert('error', 'Vui lòng nhập đầy đủ thông tin');
            return;
        }
        
        if (!web3.utils.isAddress(warehouseAddress) || !web3.utils.isAddress(supplierAddress)) {
            showAlert('error', 'Địa chỉ không hợp lệ');        return;
        }
        
        const treasuryContract = window.getContract('COMPANY_TREASURY_MANAGER');
        
        const tx = await treasuryContract.methods.requestEscrowForSupplierOrder(
            warehouseAddress,
            supplierAddress,
            orderId,
            amount
        ).send({
            from: currentAccount
        });
        
        const resultDiv = document.getElementById('escrowResult');
        resultDiv.className = 'result-success';
        resultDiv.innerHTML = `
            <strong>Yêu cầu ký quỹ thành công!</strong><br>
            Kho: ${warehouseAddress}<br>
            Nhà cung cấp: ${supplierAddress}<br>
            ID đơn hàng: ${orderId}<br>
            Số tiền: ${amount} wei<br>
            TX Hash: <span class="transaction-hash">${tx.transactionHash}</span>
        `;
        
    } catch (error) {
        console.error('Error requesting escrow:', error);
        showAlert('error', 'Lỗi yêu cầu ký quỹ: ' + error.message);
    } finally {
        showLoading(false);
    }
}

async function releaseEscrow() {
    if (!checkWalletConnection()) return;
    
    try {
        showLoading(true);
        
        const supplierAddress = document.getElementById('releaseSupplierAddress').value;
        const orderId = document.getElementById('releaseOrderId').value;
        const amount = document.getElementById('releaseAmount').value;
        
        if (!supplierAddress || !orderId || !amount) {
            showAlert('error', 'Vui lòng nhập đầy đủ thông tin');
            return;
        }
        
        if (!web3.utils.isAddress(supplierAddress)) {
            showAlert('error', 'Địa chỉ nhà cung cấp không hợp lệ');
            return;        }
        
        const treasuryContract = window.getContract('COMPANY_TREASURY_MANAGER');
        
        const tx = await treasuryContract.methods.releaseEscrowToSupplier(
            supplierAddress,
            orderId,
            amount
        ).send({
            from: currentAccount
        });
        
        const resultDiv = document.getElementById('releaseResult');
        resultDiv.className = 'result-success';
        resultDiv.innerHTML = `
            <strong>Giải phóng ký quỹ thành công!</strong><br>
            Nhà cung cấp: ${supplierAddress}<br>
            ID đơn hàng: ${orderId}<br>
            Số tiền: ${amount} wei<br>
            TX Hash: <span class="transaction-hash">${tx.transactionHash}</span>
        `;
        
    } catch (error) {
        console.error('Error releasing escrow:', error);
        showAlert('error', 'Lỗi giải phóng ký quỹ: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Disconnect wallet
function disconnectWallet() {
    currentAccount = null;
    accounts = [];
    updateConnectionStatus(false);
    showAlert('info', 'Đã ngắt kết nối ví');
}

// Handle network change from select dropdown
async function handleNetworkChange() {
    const networkSelect = document.getElementById('networkSelect');
    const selectedNetwork = networkSelect.value;
    
    let networkConfig;
    switch(selectedNetwork) {
        case 'ganache':
            networkConfig = NETWORK_CONFIG.GANACHE;
            break;
        case 'sepolia':
            networkConfig = NETWORK_CONFIG.SEPOLIA;
            break;
        case 'mumbai':
            networkConfig = NETWORK_CONFIG.MUMBAI;
            break;
        default:
            networkConfig = NETWORK_CONFIG.GANACHE;
    }
    
    try {
        showLoading(true);
        await switchToNetwork(networkConfig);
        showAlert('success', `Đã chuyển sang mạng ${networkConfig.chainName}!`);
        updateNetworkStatus();
        checkContractAddresses();
    } catch (error) {
        console.error('Error switching network:', error);
        showAlert('error', 'Lỗi khi chuyển mạng: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Check if contract addresses are available for current network
async function checkContractAddresses() {    try {
        const contractStatus = document.getElementById('contractStatus');
        const addresses = window.getContractAddresses();
        
        const hasAllAddresses = Object.values(addresses).every(addr => addr && addr !== '');
        
        if (hasAllAddresses) {
            contractStatus.className = 'alert alert-success mb-0';
            contractStatus.innerHTML = '<i class="fas fa-check-circle me-2"></i>Tất cả contract đã được cấu hình';
        } else {
            contractStatus.className = 'alert alert-warning mb-0';
            contractStatus.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i>Một số contract chưa có địa chỉ';
        }
        
        // Update network status display
        const chainId = await web3.eth.getChainId();
        const networkStatus = document.getElementById('networkStatus');
        let networkName = 'Unknown';
        
        switch(chainId) {
            case 5777:
                networkName = 'Ganache Local';
                break;
            case 11155111:
                networkName = 'Sepolia';
                break;
            case 80001:
                networkName = 'Mumbai';
                break;
            default:
                networkName = `Chain ${chainId}`;
        }
        
        networkStatus.innerHTML = `<i class="fas fa-globe text-success me-1"></i>Mạng: ${networkName}`;
        
    } catch (error) {
        console.error('Error checking contract addresses:', error);
        const contractStatus = document.getElementById('contractStatus');
        contractStatus.className = 'alert alert-danger mb-0';
        contractStatus.innerHTML = '<i class="fas fa-times-circle me-2"></i>Lỗi kiểm tra contract';
    }
}

// Test all contract functions
async function testAllContracts() {
    try {
        showLoading(true);
        console.log('Starting contract tests...');
        
        const results = [];
        const contractNames = [
            'ROLE_MANAGEMENT',
            'ITEMS_BASIC_MANAGEMENT', 
            'SUPPLIERS_MANAGEMENT',
            'COMPANY_TREASURY_MANAGER',
            'WAREHOUSE_INVENTORY_MANAGEMENT',
            'STORE_INVENTORY_MANAGEMENT',
            'WAREHOUSE_SUPPLIER_ORDER_MANAGEMENT',
            'CUSTOMER_ORDER_MANAGEMENT'
        ];
        
        for (const contractName of contractNames) {
            try {            console.log(`Testing ${contractName}...`);
                const contract = window.getContract(contractName);
                
                // Try to call a simple view function to test contract connection
                const address = contract.options.address;
                const code = await web3.eth.getCode(address);
                
                if (code === '0x') {
                    results.push(`❌ ${contractName}: Contract not deployed at ${address}`);
                } else {
                    results.push(`✅ ${contractName}: Connected successfully at ${address.substring(0, 10)}...`);
                }
            } catch (error) {
                results.push(`❌ ${contractName}: Error - ${error.message}`);
            }
        }
        
        // Show results
        const resultText = results.join('\n');
        console.log('Contract test results:', resultText);
        
        // Create a modal to show results
        showContractTestResults(results);
        
        showAlert('info', 'Contract test hoàn tất! Kiểm tra console và popup để xem kết quả.');
        
    } catch (error) {
        console.error('Error testing contracts:', error);
        showAlert('error', 'Lỗi khi test contracts: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Show contract test results in a modal
function showContractTestResults(results) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.setAttribute('tabindex', '-1');
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-flask me-2"></i>
                        Kết quả Test Contracts
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <pre class="bg-dark text-light p-3 rounded" style="font-size: 14px;">${results.join('\n')}</pre>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Remove modal from DOM after it's hidden
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}
