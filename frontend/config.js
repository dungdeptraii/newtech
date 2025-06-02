// Auto-generated configuration from deployed contracts
// Network và Contract Configuration
const NETWORK_CONFIG = {
    // Ganache Local Network
    ganache: {
        chainIds: ['0x1691', '0x539'], // 5777 và 1337 in hex
        chainName: 'Ganache Local',
        rpcUrls: ['http://127.0.0.1:7545', 'http://127.0.0.1:8545'],
        nativeCurrency: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18
        }
    },
    // Ethereum Sepolia Testnet
    sepolia: {
        chainIds: ['0xaa36a7'], // 11155111 in hex
        chainName: 'Sepolia Test Network',
        rpcUrls: ['https://sepolia.infura.io/v3/YOUR_INFURA_KEY'],
        blockExplorerUrls: ['https://sepolia.etherscan.io'],
        nativeCurrency: {
            name: 'SepoliaETH',
            symbol: 'SEP',
            decimals: 18
        }
    },
    mumbai: {
        chainIds: ['0x13881'], // 80001 in hex
        chainName: 'Polygon Mumbai Testnet',
        rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
        blockExplorerUrls: ['https://mumbai.polygonscan.com'],
        nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18
        }
    }
};

// Contract addresses for different networks
const CONTRACT_ADDRESSES = {
    ganache: {
        ROLE_MANAGEMENT: '0x1D4d6c3dDC0C8B72F26a75098C0eE9873d62e569',
        ITEMS_BASIC_MANAGEMENT: '0xa817016E8f2756191Dac179A5A10eFdD82ae8654',
        SUPPLIERS_MANAGEMENT: '0x83F9ef754E6Ed73BBbD96678aCF7f5bA3BFEDD84',
        COMPANY_TREASURY_MANAGER: '0x9eFB7c91DFBA0ff802537a996848D02dC23ECb1b',
        WAREHOUSE_INVENTORY_MANAGEMENT: '0x16BbbCb94AB622B58B73D1eaC8718640B09f7a03',
        STORE_INVENTORY_MANAGEMENT: '0x934e03ED83638D25b2954E4F9869e2e86b09caa8',
        WAREHOUSE_SUPPLIER_ORDER_MANAGEMENT: '0x7F8e0705d81C4F865D24E538F0BF27C924DE534D',
        CUSTOMER_ORDER_MANAGEMENT: '0x454E1dc21CB57f1E7cf704f8F5599B6eCa4CD208'
    },
    sepolia: {
        ROLE_MANAGEMENT: '',
        ITEMS_BASIC_MANAGEMENT: '',
        SUPPLIERS_MANAGEMENT: '',
        COMPANY_TREASURY_MANAGER: '',
        WAREHOUSE_INVENTORY_MANAGEMENT: '',
        STORE_INVENTORY_MANAGEMENT: '',
        WAREHOUSE_SUPPLIER_ORDER_MANAGEMENT: '',
        CUSTOMER_ORDER_MANAGEMENT: ''
    },
    mumbai: {
        ROLE_MANAGEMENT: '',
        ITEMS_BASIC_MANAGEMENT: '',
        SUPPLIERS_MANAGEMENT: '',
        COMPANY_TREASURY_MANAGER: '',
        WAREHOUSE_INVENTORY_MANAGEMENT: '',
        STORE_INVENTORY_MANAGEMENT: '',
        WAREHOUSE_SUPPLIER_ORDER_MANAGEMENT: '',
        CUSTOMER_ORDER_MANAGEMENT: ''
    }
};

// Function để lấy địa chỉ contract dựa trên mạng hiện tại
function getContractAddresses() {
    const currentNetwork = getCurrentNetworkKey();
    const addresses = CONTRACT_ADDRESSES[currentNetwork];
    
    if (!addresses) {
        console.warn(`Không tìm thấy địa chỉ contract cho mạng: ${currentNetwork}`);
        return CONTRACT_ADDRESSES.ganache; // Fallback to ganache
    }
    
    return addresses;
}

// Function để lấy key của mạng hiện tại
function getCurrentNetworkKey() {
    if (!window.ethereum || !window.ethereum.chainId) {
        return 'ganache';
    }
    
    const chainId = window.ethereum.chainId;
    
    // Kiểm tra Ganache với cả hai chain ID phổ biến
    if (chainId === '0x1691' || chainId === '0x539') { // 5777 hoặc 1337
        return 'ganache';
    }
    
    switch (chainId) {
        case '0xaa36a7': // 11155111
            return 'sepolia';
        case '0x13881': // 80001
            return 'mumbai';
        default:
            console.warn(`Mạng không được hỗ trợ: ${chainId} (${parseInt(chainId, 16)})`);
            return 'ganache';
    }
}

// Function để lấy thông tin mạng
function getNetworkConfig(networkKey) {
    return NETWORK_CONFIG[networkKey];
}

// Function để kiểm tra xem chain ID có hợp lệ không
function isValidChainId(chainId, networkKey) {
    const config = NETWORK_CONFIG[networkKey];
    if (!config) return false;
    
    if (config.chainIds) {
        return config.chainIds.includes(chainId);
    }
    
    return false;
}

// Xuất các function để sử dụng trong file khác
window.getContractAddresses = getContractAddresses;
window.getCurrentNetworkKey = getCurrentNetworkKey;
window.getNetworkConfig = getNetworkConfig;
window.isValidChainId = isValidChainId;
window.NETWORK_CONFIG = NETWORK_CONFIG;
window.CONTRACT_ADDRESSES = CONTRACT_ADDRESSES;

// Alias for getCurrentNetworkKey to match usage in contracts.js
window.getCurrentNetwork = getCurrentNetworkKey;

// Create CONFIG object for easier access
window.CONFIG = {
    getContractAddresses: getContractAddresses,
    getCurrentNetworkKey: getCurrentNetworkKey,
    getNetworkConfig: getNetworkConfig,
    isValidChainId: isValidChainId,
    NETWORK_CONFIG: NETWORK_CONFIG,
    CONTRACT_ADDRESSES: CONTRACT_ADDRESSES
};