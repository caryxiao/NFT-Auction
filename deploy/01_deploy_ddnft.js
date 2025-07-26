const { getNamedAccounts, deployments, ethers, upgrades } = require('hardhat');

module.exports = async () => {
  const { log, save } = deployments;
  const { deployer } = await getNamedAccounts();
  const deployerSigner = await ethers.getSigner(deployer);

  log('----------------------------------------------------');
  try {
    log('1. 获取 DDNFT 合约工厂...');
    const DDNFT = await ethers.getContractFactory('DDNFT', deployerSigner);

    log('2. 部署可升级 DDNFT 代理...');
    const ddnft = await upgrades.deployProxy(
      DDNFT,
      ['DD NFT', 'DDN', deployer], // initialize 参数
      {
        initializer: 'initialize',
        kind: 'transparent', // 使用透明代理
      }
    );

    await ddnft.waitForDeployment();
    const proxyAddress = ddnft.target;

    log(`   ✅ DDNFT 代理部署成功: ${proxyAddress}`);

    // 获取实现地址
    const implementationAddress =
      await upgrades.erc1967.getImplementationAddress(proxyAddress);
    log(`   实现合约地址: ${implementationAddress}`);

    // 获取管理员地址
    const adminAddress = await upgrades.erc1967.getAdminAddress(proxyAddress);
    log(`   ProxyAdmin 地址: ${adminAddress}`);

    // 验证部署结果
    log('----------------------------------------------------');
    log('3. 验证部署结果...');
    const name = await ddnft.name();
    const symbol = await ddnft.symbol();
    const owner = await ddnft.owner();

    log(`   合约名称: ${name}`);
    log(`   合约符号: ${symbol}`);
    log(`   合约 Owner: ${owner}`);

    // 保存部署信息供后续使用
    await save('DDNFTProxy', {
      address: proxyAddress,
      abi: DDNFT.interface.formatJson(),
      implementation: implementationAddress,
      admin: adminAddress,
      args: ['DD NFT', 'DDN', deployer],
    });

    log('----------------------------------------------------');
    log('🎉 部署完成！');
  } catch (error) {
    log(`❌ 部署失败: ${error.message}`);
    throw error;
  }
};

module.exports.tags = ['ddnft', 'ddnftv1'];
module.exports.dependencies = [];
