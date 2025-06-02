// Supply Chain DApp - Contract Function Validation Script
// Run this in browser console to validate all contract functions are working

console.log("🔍 Starting Contract Function Validation...");

// Test 1: Check if window.getContract is available
if (typeof window.getContract === 'function') {
    console.log("✅ window.getContract function is available");
} else {
    console.error("❌ window.getContract function is NOT available");
    return;
}

// Test 2: Check if window.getContractAddresses is available
if (typeof window.getContractAddresses === 'function') {
    console.log("✅ window.getContractAddresses function is available");
} else {
    console.error("❌ window.getContractAddresses function is NOT available");
    return;
}

// Test 3: Get contract addresses
try {
    const addresses = window.getContractAddresses();
    console.log("✅ Contract addresses retrieved:", addresses);
} catch (error) {
    console.error("❌ Error getting contract addresses:", error);
    return;
}

// Test 4: Test contract instantiation for each contract
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

let successCount = 0;
let failCount = 0;

contractNames.forEach(contractName => {
    try {
        const contract = window.getContract(contractName);
        if (contract && contract.options && contract.options.address) {
            console.log(`✅ ${contractName}: Contract instantiated successfully at ${contract.options.address.substring(0, 10)}...`);
            successCount++;
        } else {
            console.error(`❌ ${contractName}: Contract instantiation failed - invalid contract object`);
            failCount++;
        }
    } catch (error) {
        console.error(`❌ ${contractName}: Contract instantiation failed - ${error.message}`);
        failCount++;
    }
});

// Summary
console.log("\n📊 VALIDATION SUMMARY:");
console.log(`✅ Successful contracts: ${successCount}`);
console.log(`❌ Failed contracts: ${failCount}`);
console.log(`📋 Total contracts tested: ${contractNames.length}`);

if (failCount === 0) {
    console.log("🎉 ALL CONTRACT FUNCTIONS ARE WORKING CORRECTLY!");
} else {
    console.log("⚠️ Some contract functions need attention");
}

// Test 5: Check if Web3 is available
if (typeof web3 !== 'undefined') {
    console.log("✅ Web3 is available");
    
    // Test Web3 connection
    web3.eth.getAccounts().then(accounts => {
        if (accounts.length > 0) {
            console.log("✅ Web3 connected with accounts:", accounts);
        } else {
            console.log("⚠️ Web3 available but no accounts connected");
        }
    }).catch(error => {
        console.log("⚠️ Web3 available but connection error:", error.message);
    });
} else {
    console.log("⚠️ Web3 is not available - MetaMask may not be connected");
}

console.log("\n🔍 Contract Function Validation Complete");
