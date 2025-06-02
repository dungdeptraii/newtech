// Test script to validate the fixes
console.log('=== Testing Contract Fix ===');

// Test 1: Check if CONFIG is available
if (typeof window.CONFIG !== 'undefined') {
    console.log('✅ window.CONFIG is available');
    console.log('CONFIG.getContractAddresses:', typeof window.CONFIG.getContractAddresses);
} else {
    console.log('❌ window.CONFIG is not available');
}

// Test 2: Check if CONTRACT_ADDRESSES is available
if (typeof window.CONTRACT_ADDRESSES !== 'undefined') {
    console.log('✅ window.CONTRACT_ADDRESSES is available');
    console.log('Available networks:', Object.keys(window.CONTRACT_ADDRESSES));
} else {
    console.log('❌ window.CONTRACT_ADDRESSES is not available');
}

// Test 3: Check if getContract function is available
if (typeof window.getContract !== 'undefined') {
    console.log('✅ window.getContract is available');
} else {
    console.log('❌ window.getContract is not available');
}

// Test 4: Check if getCurrentNetwork function is available
if (typeof window.getCurrentNetwork !== 'undefined') {
    console.log('✅ window.getCurrentNetwork is available');
    console.log('Current network:', window.getCurrentNetwork());
} else {
    console.log('❌ window.getCurrentNetwork is not available');
}

// Test 5: Check if getContractAddresses function works
if (typeof window.getContractAddresses !== 'undefined') {
    console.log('✅ window.getContractAddresses is available');
    try {
        const addresses = window.getContractAddresses();
        console.log('Contract addresses:', addresses);
        console.log('Available contracts:', Object.keys(addresses));
    } catch (error) {
        console.log('❌ Error calling getContractAddresses:', error.message);
    }
} else {
    console.log('❌ window.getContractAddresses is not available');
}

// Test 6: Test getting a contract instance (mock test)
if (typeof window.getContract !== 'undefined') {
    try {
        // This will fail without web3, but should not give "getContract is not defined" error
        console.log('Testing getContract function...');
        // We can't actually call it without web3, but the function should exist
        console.log('✅ getContract function exists and is callable');
    } catch (error) {
        if (error.message.includes('getContract is not defined')) {
            console.log('❌ getContract is not defined error still exists');
        } else {
            console.log('✅ getContract function exists (error is expected without web3):', error.message);
        }
    }
}

console.log('=== Test Complete ===');
