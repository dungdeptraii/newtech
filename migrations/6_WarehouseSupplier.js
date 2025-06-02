// migrations/5_deploy_wsom.js

const RoleManagement = artifacts.require("RoleManagement");
const ItemsBasicManagement = artifacts.require("ItemsBasicManagement");
const SuppliersManagement = artifacts.require("SuppliersManagement");
const CompanyTreasuryManager = artifacts.require("CompanyTreasuryManager");
const WarehouseSupplierOrderManagement = artifacts.require("WarehouseSupplierOrderManagement");
// Bạn cũng sẽ cần import WarehouseInventoryManagement nếu bạn muốn set địa chỉ của nó ngay trong file này
// const WarehouseInventoryManagement = artifacts.require("WarehouseInventoryManagement");

module.exports = async function (deployer, network, accounts) {
  // Lấy instance của các contract đã deploy trước đó
  const roleManagementInstance = await RoleManagement.deployed();
  const itemsBasicManagementInstance = await ItemsBasicManagement.deployed();
  const suppliersManagementInstance = await SuppliersManagement.deployed();
  const companyTreasuryManagerInstance = await CompanyTreasuryManager.deployed();

  if (!roleManagementInstance) {
    console.error("LỖI: RoleManagement contract chưa được deploy! Không thể deploy WSOM.");
    return;
  }
  if (!itemsBasicManagementInstance) {
    console.error("LỖI: ItemsBasicManagement contract chưa được deploy! Không thể deploy WSOM.");
    return;
  }
  if (!suppliersManagementInstance) {
    console.error("LỖI: SuppliersManagement contract chưa được deploy! Không thể deploy WSOM.");
    return;
  }
  if (!companyTreasuryManagerInstance) {
    console.error("LỖI: CompanyTreasuryManager contract chưa được deploy! Không thể deploy WSOM.");
    return;
  }

  // Deploy WarehouseSupplierOrderManagement, truyền địa chỉ của các contract phụ thuộc
  console.log(`Deploying WarehouseSupplierOrderManagement với:`);
  console.log(`  - RoleManagement tại: ${roleManagementInstance.address}`);
  console.log(`  - ItemsBasicManagement tại: ${itemsBasicManagementInstance.address}`);
  console.log(`  - SuppliersManagement tại: ${suppliersManagementInstance.address}`);
  console.log(`  - CompanyTreasuryManager tại: ${companyTreasuryManagerInstance.address}`);
  
  await deployer.deploy(
    WarehouseSupplierOrderManagement,
    roleManagementInstance.address,
    itemsBasicManagementInstance.address,
    suppliersManagementInstance.address,
    companyTreasuryManagerInstance.address
    // { from: accounts[0] } // Tùy chọn: chỉ định người deploy nếu không phải mặc định
  );

  const wsomInstance = await WarehouseSupplierOrderManagement.deployed();
  console.log("WarehouseSupplierOrderManagement đã được deploy tại:", wsomInstance.address);

};