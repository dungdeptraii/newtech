const RoleManagement = artifacts.require("RoleManagement");
const ItemsBasicManagement = artifacts.require("ItemsBasicManagement");
const CompanyTreasuryManager = artifacts.require("CompanyTreasuryManager");
const CustomerOrderManagement = artifacts.require("CustomerOrderManagement"); // Đảm bảo tên này khớp

module.exports = async function (deployer, network, accounts) {
  const deployerAccount = accounts[0];

  // Lấy instance của các contract đã deploy trước đó
  const roleManagementInstance = await RoleManagement.deployed();
  const itemsBasicManagementInstance = await ItemsBasicManagement.deployed();
  const companyTreasuryManagerInstance = await CompanyTreasuryManager.deployed();

  if (!roleManagementInstance || !itemsBasicManagementInstance || !companyTreasuryManagerInstance) {
    console.error("LỖI: Một hoặc nhiều contract phụ thuộc (RM, IBM, CTM) chưa được deploy! Không thể deploy CustomerOrderManagement.");
    return; 
  }

  console.log(`Deploying CustomerOrderManagement với:`);
  console.log(`  - RoleManagement tại: ${roleManagementInstance.address}`);
  console.log(`  - ItemsBasicManagement tại: ${itemsBasicManagementInstance.address}`);
  console.log(`  - CompanyTreasuryManager tại: ${companyTreasuryManagerInstance.address}`);
  
  await deployer.deploy(
    CustomerOrderManagement,
    roleManagementInstance.address,
    itemsBasicManagementInstance.address,
    companyTreasuryManagerInstance.address, // Địa chỉ của CTM để COM có thể chuyển tiền vào
    { from: deployerAccount }
  );

  const comInstance = await CustomerOrderManagement.deployed();
  console.log("CustomerOrderManagement đã được deploy tại:", comInstance.address);

  // LƯU Ý QUAN TRỌNG:
  // Các hàm setStoreInventoryManagementAddress và setWarehouseInventoryManagementAddress trên comInstance
  // sẽ cần được gọi trong script migration setup chung (ví dụ: 99_setup_all_addresses.js)
  // sau khi StoreInventoryManagement (SIM) và WarehouseInventoryManagement (WIM) đã được deploy.
};