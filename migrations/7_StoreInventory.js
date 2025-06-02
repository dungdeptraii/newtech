const RoleManagement = artifacts.require("RoleManagement");
const ItemsBasicManagement = artifacts.require("ItemsBasicManagement");
const StoreInventoryManagement = artifacts.require("StoreInventoryManagement"); // Đảm bảo tên này khớp với tên contract trong file .sol

module.exports = async function (deployer, network, accounts) {
  const deployerAccount = accounts[0]; // Người deploy mặc định

  // Lấy instance của các contract đã deploy trước đó
  const roleManagementInstance = await RoleManagement.deployed();
  const itemsBasicManagementInstance = await ItemsBasicManagement.deployed();

  if (!roleManagementInstance) {
    console.error("LỖI: RoleManagement contract chưa được deploy! Không thể deploy StoreInventoryManagement.");
    return; 
  }
  if (!itemsBasicManagementInstance) {
    console.error("LỖI: ItemsBasicManagement contract chưa được deploy! Không thể deploy StoreInventoryManagement.");
    return; 
  }

  console.log(`Deploying StoreInventoryManagement với:`);
  console.log(`  - RoleManagement tại: ${roleManagementInstance.address}`);
  console.log(`  - ItemsBasicManagement tại: ${itemsBasicManagementInstance.address}`);
  
  await deployer.deploy(
    StoreInventoryManagement,
    roleManagementInstance.address,
    itemsBasicManagementInstance.address,
    { from: deployerAccount }
  );

  const simInstance = await StoreInventoryManagement.deployed();
  console.log("StoreInventoryManagement đã được deploy tại:", simInstance.address);
};