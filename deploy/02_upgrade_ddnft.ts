import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const upgradeDDNFT: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { getNamedAccounts, deployments, ethers, upgrades } = hre;
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
  } catch (error: any) {
    log(`❌ 升级失败: ${error.message}`);
    throw error;
  }
};

upgradeDDNFT.tags = ['ddnft', 'ddnftv2'];
upgradeDDNFT.dependencies = ['ddnftv1'];

export default upgradeDDNFT;
