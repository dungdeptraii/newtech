// migrations/3_ItemsBasicManagement.js
const RoleManagement = artifacts.require("RoleManagement");
const ItemsBasicManagement = artifacts.require("ItemsBasicManagement");

module.exports = async function (deployer, network, accounts) {
  // Đảm bảo RoleManagement đã được deploy
  const roleManagementInstance = await RoleManagement.deployed();
  if (!roleManagementInstance) {
    console.error("LỖI: RoleManagement contract chưa được deploy hoặc deploy thất bại!");
    return; // Dừng nếu không tìm thấy RoleManagement
  }

  console.log("Deploying ItemsBasicManagement với RoleManagement tại:", roleManagementInstance.address);
  await deployer.deploy(ItemsBasicManagement, roleManagementInstance.address);

  const itemsBasicManagementInstance = await ItemsBasicManagement.deployed();
  console.log("ItemsBasicManagement đã được deploy tại:", itemsBasicManagementInstance.address);
};
