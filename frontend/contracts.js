// Contract ABIs và Addresses - Sử dụng config động
// Get contract addresses based on current network
function getContractAddresses() {
    if (typeof window !== 'undefined' && window.CONFIG && window.CONFIG.getContractAddresses) {
        return window.CONFIG.getContractAddresses();
    }    // Fallback to global CONTRACT_ADDRESSES if available
    if (typeof window !== 'undefined' && window.CONTRACT_ADDRESSES) {
        const currentNetwork = getCurrentNetwork();
        return window.CONTRACT_ADDRESSES[currentNetwork] || window.CONTRACT_ADDRESSES.ganache || {};
    }
    // Final fallback to default Ganache addresses
    return {
        ROLE_MANAGEMENT: '0x1D4d6c3dDC0C8B72F26a75098C0eE9873d62e569',
        ITEMS_BASIC_MANAGEMENT: '0xa817016E8f2756191Dac179A5A10eFdD82ae8654',
        SUPPLIERS_MANAGEMENT: '0x83F9ef754E6Ed73BBbD96678aCF7f5bA3BFEDD84',
        COMPANY_TREASURY_MANAGER: '0x9eFB7c91DFBA0ff802537a996848D02dC23ECb1b',
        WAREHOUSE_INVENTORY_MANAGEMENT: '0x16BbbCb94AB622B58B73D1eaC8718640B09f7a03',
        STORE_INVENTORY_MANAGEMENT: '0x934e03ED83638D25b2954E4F9869e2e86b09caa8',
        WAREHOUSE_SUPPLIER_ORDER_MANAGEMENT: '0x7F8e0705d81C4F865D24E538F0BF27C924DE534D',
        CUSTOMER_ORDER_MANAGEMENT: '0x454E1dc21CB57f1E7cf704f8F5599B6eCa4CD208'
    };
}

// Helper function to get current network
function getCurrentNetwork() {
    if (typeof web3 !== 'undefined') {
        try {
            const chainId = web3.eth.getChainId ? web3.eth.getChainId() : 5777;
            switch(chainId) {
                case 5777:
                case 1337:
                    return 'ganache';
                case 11155111:
                    return 'sepolia';
                case 80001:
                    return 'mumbai';
                default:
                    return 'ganache';
            }
        } catch (error) {
            console.warn('Error getting network:', error);
            return 'ganache';
        }
    }
    return 'ganache';
}

// Role Management ABI
const ROLE_MANAGEMENT_ABI = [
    {
        "inputs": [{"internalType": "bytes32", "name": "role", "type": "bytes32"}],
        "name": "DEFAULT_ADMIN_ROLE",
        "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "WAREHOUSE_MANAGER_ROLE",
        "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "SUPPLIER_ROLE", 
        "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "STORE_MANAGER_ROLE",
        "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "BOARD_ROLE",
        "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "FINANCE_DIRECTOR_ROLE",
        "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "WAREHOUSE_DIRECTOR_ROLE", 
        "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "bytes32", "name": "role", "type": "bytes32"},
            {"internalType": "address", "name": "account", "type": "address"}
        ],
        "name": "hasRole",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "bytes32", "name": "role", "type": "bytes32"},
            {"internalType": "address", "name": "account", "type": "address"}
        ],
        "name": "grantRole",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "bytes32", "name": "role", "type": "bytes32"},
            {"internalType": "address", "name": "account", "type": "address"}
        ],
        "name": "revokeRole",
        "outputs": [],
        "stateMutability": "nonpayable", 
        "type": "function"
    }
];

// Items Basic Management ABI
const ITEMS_BASIC_MANAGEMENT_ABI = [
    {
        "inputs": [{"internalType": "address", "name": "warehouseAddress", "type": "address"}],
        "name": "getWarehouseInfo",
        "outputs": [
            {
                "components": [
                    {"internalType": "string", "name": "name", "type": "string"},
                    {"internalType": "string", "name": "location", "type": "string"},
                    {"internalType": "bool", "name": "isActive", "type": "bool"}
                ],
                "internalType": "struct PhysicalLocationInfo",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "storeAddress", "type": "address"}],
        "name": "getStoreInfo",
        "outputs": [
            {
                "components": [
                    {"internalType": "string", "name": "name", "type": "string"},
                    {"internalType": "string", "name": "location", "type": "string"}, 
                    {"internalType": "bool", "name": "isActive", "type": "bool"}
                ],
                "internalType": "struct PhysicalLocationInfo",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "string", "name": "itemId", "type": "string"},
            {"internalType": "address", "name": "storeAddress", "type": "address"}
        ],
        "name": "getItemRetailPriceAtStore",
        "outputs": [
            {"internalType": "uint256", "name": "price", "type": "uint256"},
            {"internalType": "bool", "name": "priceExists", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// Suppliers Management ABI
const SUPPLIERS_MANAGEMENT_ABI = [
    {
        "inputs": [{"internalType": "address", "name": "supplierAddress", "type": "address"}],
        "name": "getSupplierInfo",
        "outputs": [
            {
                "components": [
                    {"internalType": "address", "name": "supplierId", "type": "address"},
                    {"internalType": "string", "name": "name", "type": "string"},
                    {"internalType": "bool", "name": "isApprovedByBoard", "type": "bool"},
                    {"internalType": "bool", "name": "exists", "type": "bool"}
                ],
                "internalType": "struct SupplierInfo",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "supplierAddress", "type": "address"},
            {"internalType": "string", "name": "itemId", "type": "string"}
        ],
        "name": "getSupplierItemDetails",
        "outputs": [
            {
                "components": [
                    {"internalType": "string", "name": "itemId", "type": "string"},
                    {"internalType": "uint256", "name": "pricePerUnit", "type": "uint256"},
                    {"internalType": "uint256", "name": "availableQuantity", "type": "uint256"},
                    {"internalType": "bool", "name": "isAvailable", "type": "bool"}
                ],
                "internalType": "struct SupplierItemListing",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// Company Treasury Manager ABI
const COMPANY_TREASURY_MANAGER_ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "warehouseAddress", "type": "address"},
            {"internalType": "address", "name": "supplierAddress", "type": "address"},
            {"internalType": "string", "name": "supplierOrderId", "type": "string"},
            {"internalType": "uint256", "name": "amount", "type": "uint256"}
        ],
        "name": "requestEscrowForSupplierOrder",
        "outputs": [{"internalType": "bool", "name": "success", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "supplierAddress", "type": "address"},
            {"internalType": "string", "name": "supplierOrderId", "type": "string"},
            {"internalType": "uint256", "name": "amount", "type": "uint256"}
        ],
        "name": "releaseEscrowToSupplier",
        "outputs": [{"internalType": "bool", "name": "success", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "warehouseAddress", "type": "address"},
            {"internalType": "string", "name": "supplierOrderId", "type": "string"},
            {"internalType": "uint256", "name": "amount", "type": "uint256"}
        ],
        "name": "refundEscrowToTreasury",
        "outputs": [{"internalType": "bool", "name": "success", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// Warehouse Inventory Management ABI
const WAREHOUSE_INVENTORY_MANAGEMENT_ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "requestingStoreManager", "type": "address"},
            {"internalType": "address", "name": "storeAddress", "type": "address"},
            {"internalType": "address", "name": "designatedWarehouseAddress", "type": "address"},
            {"internalType": "string", "name": "itemId", "type": "string"},
            {"internalType": "uint256", "name": "quantity", "type": "uint256"}
        ],
        "name": "requestStockTransferToStore",
        "outputs": [{"internalType": "uint256", "name": "internalTransferId", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "warehouseAddress", "type": "address"},
            {"internalType": "string", "name": "itemId", "type": "string"},
            {"internalType": "uint256", "name": "quantity", "type": "uint256"},
            {"internalType": "uint256", "name": "wsOrderId", "type": "uint256"}
        ],
        "name": "recordStockInFromSupplier",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "returnToWarehouseAddress", "type": "address"},
            {"internalType": "string", "name": "itemId", "type": "string"},
            {"internalType": "uint256", "name": "quantity", "type": "uint256"},
            {"internalType": "uint256", "name": "customerOrderId", "type": "uint256"}
        ],
        "name": "recordReturnedStockByCustomer",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// Store Inventory Management ABI
const STORE_INVENTORY_MANAGEMENT_ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "storeAddress", "type": "address"},
            {"internalType": "string", "name": "itemId", "type": "string"},
            {"internalType": "uint256", "name": "quantity", "type": "uint256"},
            {"internalType": "address", "name": "fromWarehouseAddress", "type": "address"},
            {"internalType": "uint256", "name": "internalTransferId", "type": "uint256"}
        ],
        "name": "confirmStockReceivedFromWarehouse",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "storeAddress", "type": "address"},
            {"internalType": "string", "name": "itemId", "type": "string"}
        ],
        "name": "getStoreStockLevel",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "storeAddress", "type": "address"},
            {"internalType": "string", "name": "itemId", "type": "string"},
            {"internalType": "uint256", "name": "quantity", "type": "uint256"},
            {"internalType": "uint256", "name": "customerOrderId", "type": "uint256"}
        ],
        "name": "deductStockForCustomerSale",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// Warehouse Supplier Order Management ABI (minimal)
const WAREHOUSE_SUPPLIER_ORDER_MANAGEMENT_ABI = [
    // Add specific functions as needed
];

// Customer Order Management ABI (minimal)
const CUSTOMER_ORDER_MANAGEMENT_ABI = [
    // Add specific functions as needed  
];

// Helper function to get contract instance
function getContract(contractName) {
    const addresses = getContractAddresses();
    const address = addresses[contractName];
    let abi;
    
    switch(contractName) {
        case 'ROLE_MANAGEMENT':
            abi = ROLE_MANAGEMENT_ABI;
            break;
        case 'ITEMS_BASIC_MANAGEMENT':
            abi = ITEMS_BASIC_MANAGEMENT_ABI;
            break;
        case 'SUPPLIERS_MANAGEMENT':
            abi = SUPPLIERS_MANAGEMENT_ABI;
            break;
        case 'COMPANY_TREASURY_MANAGER':
            abi = COMPANY_TREASURY_MANAGER_ABI;
            break;
        case 'WAREHOUSE_INVENTORY_MANAGEMENT':
            abi = WAREHOUSE_INVENTORY_MANAGEMENT_ABI;
            break;
        case 'STORE_INVENTORY_MANAGEMENT':
            abi = STORE_INVENTORY_MANAGEMENT_ABI;
            break;
        case 'WAREHOUSE_SUPPLIER_ORDER_MANAGEMENT':
            abi = WAREHOUSE_SUPPLIER_ORDER_MANAGEMENT_ABI;
            break;
        case 'CUSTOMER_ORDER_MANAGEMENT':
            abi = CUSTOMER_ORDER_MANAGEMENT_ABI;
            break;
        default:
            throw new Error(`Unknown contract: ${contractName}`);
    }
    
    if (!address) {
        throw new Error(`Contract address not set for: ${contractName}`);
    }
    
    return new web3.eth.Contract(abi, address);
}

// Helper function to update contract addresses (call this after deployment)
function updateContractAddresses(addresses) {
    if (typeof window !== 'undefined' && window.CONTRACT_ADDRESSES) {
        Object.assign(window.CONTRACT_ADDRESSES, addresses);
    }
}

// Make functions available globally for browser environment
window.getContract = getContract;
window.getContractAddresses = getContractAddresses;
window.updateContractAddresses = updateContractAddresses;

// Export contract ABIs for direct access if needed
window.ROLE_MANAGEMENT_ABI = ROLE_MANAGEMENT_ABI;
window.ITEMS_BASIC_MANAGEMENT_ABI = ITEMS_BASIC_MANAGEMENT_ABI;
window.SUPPLIERS_MANAGEMENT_ABI = SUPPLIERS_MANAGEMENT_ABI;
window.COMPANY_TREASURY_MANAGER_ABI = COMPANY_TREASURY_MANAGER_ABI;
window.WAREHOUSE_INVENTORY_MANAGEMENT_ABI = WAREHOUSE_INVENTORY_MANAGEMENT_ABI;
window.STORE_INVENTORY_MANAGEMENT_ABI = STORE_INVENTORY_MANAGEMENT_ABI;
window.WAREHOUSE_SUPPLIER_ORDER_MANAGEMENT_ABI = WAREHOUSE_SUPPLIER_ORDER_MANAGEMENT_ABI;
window.CUSTOMER_ORDER_MANAGEMENT_ABI = CUSTOMER_ORDER_MANAGEMENT_ABI;
