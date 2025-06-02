// migrations/3.1_SuppliersManagement.js
const RoleManagement = artifacts.require("RoleManagement");
const ItemsBasicManagement = artifacts.require("ItemsBasicManagement");
const SuppliersManagement = artifacts.require("SuppliersManagement");

module.exports = async function (deployer, network, accounts) {
  // Đảm bảo RoleManagement và ItemsBasicManagement đã được deploy
  const roleManagementInstance = await RoleManagement.deployed();
  const itemsBasicManagementInstance = await ItemsBasicManagement.deployed();
  
  if (!roleManagementInstance) {
    console.error("LỖI: RoleManagement contract chưa được deploy hoặc deploy thất bại!");
    return;
  }
  
  if (!itemsBasicManagementInstance) {
    console.error("LỖI: ItemsBasicManagement contract chưa được deploy hoặc deploy thất bại!");
    return;
  }

  console.log("Deploying SuppliersManagement với RoleManagement tại:", roleManagementInstance.address);
  console.log("và ItemsBasicManagement tại:", itemsBasicManagementInstance.address);
  
  await deployer.deploy(
    SuppliersManagement, 
    roleManagementInstance.address,
    itemsBasicManagementInstance.address
  );

  const suppliersManagementInstance = await SuppliersManagement.deployed();
  console.log("SuppliersManagement đã được deploy tại:", suppliersManagementInstance.address);
};
