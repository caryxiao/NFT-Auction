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

    const oldLogicAddress =
      await upgrades.erc1967.getImplementationAddress(proxyAddress);
    log(`代理地址: ${proxyAddress}, 旧逻辑合约地址: ${oldLogicAddress}`);

    log('1. 获取 DDNFTV2 合约工厂...');
    const DDNFTV2 = await ethers.getContractFactory('DDNFTV2', deployerSigner);

    log('2. 执行升级...');
    const upgraded = await upgrades.upgradeProxy(proxyAddress, DDNFTV2, {
      redeployImplementation: 'always', // 强制重新部署实现合约
    });
    await upgraded.waitForDeployment();

    log('   ✅ 升级交易已确认！');

    // 等待状态传播完成
    log('3. 等待状态传播完成...');
    let newLogicAddress = oldLogicAddress;
    let attempts = 0;
    const maxAttempts = 15; // 最多等待30秒

    while (newLogicAddress === oldLogicAddress && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
      newLogicAddress =
        await upgrades.erc1967.getImplementationAddress(proxyAddress);
      attempts++;
      log(
        `   检查实现地址... (${attempts}/${maxAttempts}): ${newLogicAddress.substring(0, 10)}...`
      );
    }

    if (newLogicAddress === oldLogicAddress) {
      throw new Error('升级后实现合约地址未变化，升级可能失败');
    }

    log(`   ✅ 新逻辑合约地址: ${newLogicAddress}`);

    // 等待额外的2秒确保状态完全同步
    log('4. 等待状态完全同步...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    log('5. 检查并调用 initializeV2...');
    const ddnftv2 = await ethers.getContractAt('DDNFTV2', proxyAddress);

    // 首先检查当前状态
    const currentVersion = await ddnftv2.version();
    log(`   当前合约版本: ${currentVersion}`);

    // 检查 Pausable 是否可用（这能确认 DDNFTV2 功能是否正常）
    let pausableWorking = false;
    try {
      const isPaused = await ddnftv2.paused();
      log(`   Pausable 功能检查: ${isPaused ? '已暂停' : '未暂停'}`);
      pausableWorking = true;
    } catch (error) {
      log(`   ❌ Pausable 功能不可用，可能需要调用 initializeV2`);
    }

    // 只有在 Pausable 不工作时才尝试调用 initializeV2
    if (!pausableWorking || currentVersion.toString() !== '2') {
      try {
        log('   🔄 正在调用 initializeV2...');
        const initTx = await ddnftv2.initializeV2();
        await initTx.wait();
        log('   ✅ initializeV2 调用成功');
      } catch (error: any) {
        if (
          error.message.includes(
            'Initializable: contract is already initialized'
          ) ||
          error.message.includes('InvalidInitialization')
        ) {
          log('   ⚠️  initializeV2 已经被调用过，跳过');
        } else {
          throw error;
        }
      }
    } else {
      log('   ✅ 合约已经完全初始化，跳过 initializeV2');
    }

    log('----------------------------------------------------');
    log('6. 验证最终状态...');

    const finalVersion = await ddnftv2.version();
    const owner = await ddnftv2.owner();
    const isPaused = await ddnftv2.paused();

    log(`   最终合约版本: ${finalVersion}`);
    log(`   合约 Owner: ${owner}`);
    log(`   Pausable 状态: ${isPaused ? '已暂停' : '未暂停'}`);

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
