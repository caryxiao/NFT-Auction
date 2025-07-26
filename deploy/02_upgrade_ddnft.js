/**
 * @typedef {import('@openzeppelin/hardhat-upgrades').HardhatUpgrades} HardhatUpgrades
 */

const { getNamedAccounts, deployments, ethers, upgrades } = require('hardhat');

/**
 * @type {HardhatUpgrades} upgrades - Hardhat Upgrades 插件对象
 * @property {Object} erc1967 - ERC1967 代理工具
 * @property {function(string): Promise<string>} erc1967.getImplementationAddress - 获取代理的实现合约地址
 * @property {function(string): Promise<string>} erc1967.getAdminAddress - 获取代理的管理员地址
 * @property {function(string): Promise<string>} erc1967.getBeaconAddress - 获取代理的信标地址
 */

module.exports = async () => {
  const { log, get } = deployments;
  const { deployer } = await getNamedAccounts();
  const deployerSigner = await ethers.getSigner(deployer);

  log('----------------------------------------------------');

  try {
    // 获取已部署的代理地址
    const proxyDeployment = await get('DDNFTProxy');
    const proxyAddress = proxyDeployment.address;

    log(`代理地址: ${proxyAddress}`);

    log('1. 获取 DDNFTV2 合约工厂...');
    const DDNFTV2 = await ethers.getContractFactory('DDNFTV2', deployerSigner);

    log('2. 执行升级...');
    const upgraded = await upgrades.upgradeProxy(proxyAddress, DDNFTV2);
    await upgraded.waitForDeployment();

    log('   ✅ 升级成功！');

    // 获取新的实现地址
    const newImplementationAddress =
      await upgrades.erc1967.getImplementationAddress(proxyAddress);
    log(`   新实现合约地址: ${newImplementationAddress}`);

    log('----------------------------------------------------');
    log('3. 调用 initializeV2...');

    // 通过代理调用 initializeV2
    const ddnftv2 = await ethers.getContractAt(
      'DDNFTV2',
      proxyAddress,
      deployerSigner
    );
    const initTx = await ddnftv2.initializeV2();
    await initTx.wait();

    log('   ✅ initializeV2 调用成功');

    log('----------------------------------------------------');
    log('4. 验证升级结果...');

    const name = await ddnftv2.name();
    const symbol = await ddnftv2.symbol();
    const owner = await ddnftv2.owner();
    const version = await ddnftv2.version();

    log(`   合约名称: ${name}`);
    log(`   合约符号: ${symbol}`);
    log(`   合约 Owner: ${owner}`);
    log(`   合约版本: ${version}`);

    // 测试新功能
    log('----------------------------------------------------');
    log('5. 测试新功能...');

    // 测试 pause/unpause
    const pauseTx = await ddnftv2.pause();
    await pauseTx.wait();
    log('   ✅ pause 功能测试成功');

    const unpauseTx = await ddnftv2.unpause();
    await unpauseTx.wait();
    log('   ✅ unpause 功能测试成功');

    log('----------------------------------------------------');
    log('🎉 升级完成！所有功能正常！');
  } catch (error) {
    log(`❌ 升级失败: ${error.message}`);
    throw error;
  }
};

module.exports.tags = ['ddnft', 'ddnftv2'];
module.exports.dependencies = ['ddnftv1'];
