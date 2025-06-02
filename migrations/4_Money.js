const RoleManagement = artifacts.require("RoleManagement");
const ItemsBasicManagement = artifacts.require("ItemsBasicManagement");
const SuppliersManagement = artifacts.require("SuppliersManagement");
const CompanyTreasuryManager = artifacts.require("CompanyTreasuryManager");

module.exports = async function (deployer, network, accounts) {
  // Lấy instance của các contract đã deploy trước đó
  const roleManagementInstance = await RoleManagement.deployed();
  const itemsBasicManagementInstance = await ItemsBasicManagement.deployed();
  const suppliersManagementInstance = await SuppliersManagement.deployed();

  if (!roleManagementInstance) {
    console.error("LỖI: RoleManagement contract chưa được deploy hoặc deploy thất bại! Không thể deploy CompanyTreasuryManager.");
    return; 
  }
  if (!itemsBasicManagementInstance) {
    console.error("LỖI: ItemsBasicManagement contract chưa được deploy hoặc deploy thất bại! Không thể deploy CompanyTreasuryManager.");
    return; 
  }
  if (!suppliersManagementInstance) {
    console.error("LỖI: SuppliersManagement contract chưa được deploy hoặc deploy thất bại! Không thể deploy CompanyTreasuryManager.");
    return; 
  }

  // Lấy tổng vốn từ RoleManagement để truyền vào constructor của CTM và gửi kèm khi deploy
  const totalCapitalFromRM = await roleManagementInstance.totalCapital();
  console.log(`Tổng vốn từ RoleManagement cần cho CTM: ${web3.utils.fromWei(totalCapitalFromRM, 'ether')} ETH`);

  const deployerAccount = accounts[0]; // Mặc định người deploy là tài khoản đầu tiên
  const deployerBalance = await web3.eth.getBalance(deployerAccount);
  console.log(`Số dư của người deploy (${deployerAccount}): ${web3.utils.fromWei(deployerBalance, 'ether')} ETH`);

  if (web3.utils.toBN(deployerBalance).lt(web3.utils.toBN(totalCapitalFromRM))) {
    // Đây chỉ là cảnh báo, truffle sẽ tự báo lỗi nếu không đủ gas/value
    console.warn(`CẢNH BÁO: Số dư của người deploy (${web3.utils.fromWei(deployerBalance, 'ether')} ETH) có thể không đủ để gửi ${web3.utils.fromWei(totalCapitalFromRM, 'ether')} ETH cho CompanyTreasuryManager.`);
  }

  console.log(`Deploying CompanyTreasuryManager với:`);
  console.log(`  - RoleManagement tại: ${roleManagementInstance.address}`);
  console.log(`  - ItemsBasicManagement tại: ${itemsBasicManagementInstance.address}`);
  console.log(`  - SuppliersManagement tại: ${suppliersManagementInstance.address}`);
  console.log(`  - Vốn ban đầu dự kiến: ${web3.utils.fromWei(totalCapitalFromRM, 'ether')} ETH`);
  console.log(`  - Gửi kèm msg.value: ${web3.utils.fromWei(totalCapitalFromRM, 'ether')} ETH từ ${deployerAccount}`);
  
  // Deploy CompanyTreasuryManager, truyền địa chỉ của RoleManagement, ItemsBasicManagement, SuppliersManagement,
  // giá trị totalCapitalFromRM làm tham số _expectedInitialCapital,
  // và gửi kèm giá trị Ether bằng totalCapitalFromRM
  await deployer.deploy(
    CompanyTreasuryManager,
    roleManagementInstance.address,
    itemsBasicManagementInstance.address,
    suppliersManagementInstance.address,
    totalCapitalFromRM, // Tham số thứ 4 cho constructor: _expectedInitialCapital
    { 
      from: deployerAccount, 
      value: totalCapitalFromRM // Số Ether gửi kèm (msg.value)
    }
  );

  const ctmInstance = await CompanyTreasuryManager.deployed();
  console.log("CompanyTreasuryManager đã được deploy tại:", ctmInstance.address);

  const ctmBalance = await web3.eth.getBalance(ctmInstance.address);
  console.log(`Số dư của CompanyTreasuryManager sau khi deploy: ${web3.utils.fromWei(ctmBalance, 'ether')} ETH`);
};