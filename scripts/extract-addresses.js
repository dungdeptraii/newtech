const fs = require('fs');
const path = require('path');

// Contract names mapping
const CONTRACT_MAPPINGS = {
    'RoleManagement': 'ROLE_MANAGEMENT',
    'ItemsBasicManagement': 'ITEMS_BASIC_MANAGEMENT',
    'SuppliersManagement': 'SUPPLIERS_MANAGEMENT',
    'CompanyTreasuryManager': 'COMPANY_TREASURY_MANAGER',
    'WarehouseInventoryManagement': 'WAREHOUSE_INVENTORY_MANAGEMENT',
    'StoreInventoryManagement': 'STORE_INVENTORY_MANAGEMENT',
    'WarehouseSupplierOrderManagement': 'WAREHOUSE_SUPPLIER_ORDER_MANAGEMENT',
    'CustomerOrderManagement': 'CUSTOMER_ORDER_MANAGEMENT'
};

// Extract addresses from build files
function extractAddresses() {
    const buildDir = path.join(__dirname, '../build/contracts');
    const addresses = {};
    
    console.log('🔍 Extracting contract addresses from build files...\n');
    
    Object.keys(CONTRACT_MAPPINGS).forEach(contractName => {
        const buildFile = path.join(buildDir, `${contractName}.json`);
        
        try {
            if (fs.existsSync(buildFile)) {
                const buildData = JSON.parse(fs.readFileSync(buildFile, 'utf8'));
                
                // Find the deployed network
                const networks = buildData.networks;
                const networkIds = Object.keys(networks);
                
                if (networkIds.length > 0) {
                    // Get the last deployed network (usually the most recent)
                    const latestNetworkId = networkIds[networkIds.length - 1];
                    const address = networks[latestNetworkId].address;
                    
                    addresses[CONTRACT_MAPPINGS[contractName]] = address;
                    console.log(`✅ ${contractName}: ${address} (Network: ${latestNetworkId})`);
                } else {
                    console.log(`❌ ${contractName}: No deployed networks found`);
                }
            } else {
                console.log(`❌ ${contractName}: Build file not found`);
            }
        } catch (error) {
            console.log(`❌ ${contractName}: Error reading build file - ${error.message}`);
        }
    });
    
    return addresses;
}

// Generate config file
function generateConfigFile(addresses, networkId = '5777') {
    console.log('\n📝 Generating config file...');
    
    const configTemplate = `// Auto-generated configuration from deployed contracts
// Network Configuration
const NETWORK_CONFIG = {
    // Ganache Local Network
    GANACHE: {
        chainId: '0x1691', // 5777 in hex
        chainName: 'Ganache Local',
        rpcUrls: ['http://127.0.0.1:7545'],
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
        }
    },
    // Ethereum Sepolia Testnet
    SEPOLIA: {
        chainId: '0xaa36a7', // 11155111 in hex
        chainName: 'Sepolia Test Network',
        rpcUrls: ['https://sepolia.infura.io/v3/YOUR_INFURA_KEY'],
        nativeCurrency: {
            name: 'Sepolia Ether',
            symbol: 'SEP',
            decimals: 18
        },
        blockExplorerUrls: ['https://sepolia.etherscan.io']
    }
};

// Current network (change this to match your deployment)
const CURRENT_NETWORK = NETWORK_CONFIG.GANACHE;

// Contract addresses for different networks
const NETWORK_ADDRESSES = {
    // Network ${networkId}
    ${networkId}: {
${Object.entries(addresses).map(([key, address]) => 
        `        ${key}: '${address}'`
    ).join(',\n')}
    }
    // Add other networks here when deployed
};

// Get contract addresses for current network
function getContractAddresses() {
    const chainId = window.ethereum ? parseInt(window.ethereum.chainId, 16) : ${networkId};
    return NETWORK_ADDRESSES[chainId] || NETWORK_ADDRESSES[${networkId}];
}

// Switch to the correct network
async function switchToNetwork(networkConfig = CURRENT_NETWORK) {
    if (typeof window.ethereum !== 'undefined') {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: networkConfig.chainId }]
            });
        } catch (switchError) {
            // Network not added to MetaMask
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [networkConfig]
                    });
                } catch (addError) {
                    console.error('Failed to add network:', addError);
                    throw addError;
                }
            } else {
                console.error('Failed to switch network:', switchError);
                throw switchError;
            }
        }
    } else {
        throw new Error('MetaMask is not installed');
    }
}

// Export for use in other files
window.NETWORK_CONFIG = NETWORK_CONFIG;
window.CURRENT_NETWORK = CURRENT_NETWORK;
window.getContractAddresses = getContractAddresses;
window.switchToNetwork = switchToNetwork;`;

    const configPath = path.join(__dirname, '../frontend/config.js');
    fs.writeFileSync(configPath, configTemplate);
    console.log(`✅ Config file generated: ${configPath}`);
}

// Generate JavaScript config object
function generateJSConfig(addresses) {
    console.log('\n📋 JavaScript Configuration Object:');
    console.log('Copy this to your frontend/contracts.js file:\n');
    
    console.log('const CONTRACT_ADDRESSES = {');
    Object.entries(addresses).forEach(([key, address]) => {
        console.log(`    ${key}: '${address}',`);
    });
    console.log('};');
}

// Main execution
function main() {
    console.log('🚀 Smart Contract Address Extractor\n');
    
    const addresses = extractAddresses();
    
    if (Object.keys(addresses).length === 0) {
        console.log('\n❌ No contract addresses found. Make sure contracts are deployed.');
        return;
    }
    
    // Get network ID from the first contract
    const buildDir = path.join(__dirname, '../build/contracts');
    let networkId = '5777'; // default
    
    try {
        const firstContractFile = path.join(buildDir, 'RoleManagement.json');
        if (fs.existsSync(firstContractFile)) {
            const buildData = JSON.parse(fs.readFileSync(firstContractFile, 'utf8'));
            const networks = Object.keys(buildData.networks);
            if (networks.length > 0) {
                networkId = networks[networks.length - 1];
            }
        }
    } catch (error) {
        console.log('Warning: Could not determine network ID, using default 5777');
    }
    
    generateConfigFile(addresses, networkId);
    generateJSConfig(addresses);
    
    console.log('\n🎉 Address extraction completed!');
    console.log('\nNext steps:');
    console.log('1. Review the generated config.js file');
    console.log('2. Update network settings if needed');
    console.log('3. Start the frontend: npm run dev');
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { extractAddresses, generateConfigFile, generateJSConfig };
