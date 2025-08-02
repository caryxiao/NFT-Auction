import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const upgradeNFTAuctionFactory: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { getNamedAccounts, deployments, ethers, upgrades } = hre;
  const { log, get } = deployments;
  const { deployer } = await getNamedAccounts();
  const deployerSigner = await ethers.getSigner(deployer);

  log('----------------------------------------------------');

  try {
    // 获取已部署的代理地址
    const proxyDeployment = await get('NFTAuctionFactory');
    const proxyAddress = proxyDeployment.address;

    log(`代理地址: ${proxyAddress}`);

    log('1. 获取 NFTAuctionFactoryV2 合约工厂...');
    const NFTAuctionFactoryV2 = await ethers.getContractFactory(
      'NFTAuctionFactoryV2',
      deployerSigner
    );

    log('2. 执行升级...');
    const upgraded = await upgrades.upgradeProxy(
      proxyAddress,
      NFTAuctionFactoryV2
    );
    await upgraded.waitForDeployment();

    log('3. 调用 initializeV2...');
    try {
      const initTx = await upgraded.initializeV2();
      await initTx.wait();
      log('   ✅ initializeV2 调用成功');
    } catch (error: any) {
      // 检查是否是因为已经初始化而失败
      if (
        error.message.includes('execution reverted') ||
        error.message.includes('Initializable: contract is already initialized')
      ) {
        log('   ⚠️  initializeV2 跳过 - 合约可能已经初始化过或版本不匹配');
        log('   这通常是正常的，说明合约升级成功但无需重新初始化');
      } else {
        throw error; // 如果是其他错误，继续抛出
      }
    }

    log('4. 验证升级结果...');
    const version = await upgraded.version();
    log(`   ✅ 版本: ${version}`);

    // 对工厂的LogicImplementation进行升级
    const NFTAuctionV2 = await ethers.getContractFactory(
      'NFTAuctionV2',
      deployerSigner
    );
    const nftAuctionV2 = await NFTAuctionV2.deploy();
    await nftAuctionV2.waitForDeployment();
    const nftAuctionV2Address = await nftAuctionV2.getAddress();
    log(`新的逻辑合约地址: ${nftAuctionV2Address}`);
    const setLogicImplementationTx =
      await upgraded.setLogicImplementation(nftAuctionV2Address);
    await setLogicImplementationTx.wait();

    log('5. 验证升级结果...');
    const logicImplementation = await upgraded.logicImplementation();
    log(`工厂的逻辑合约地址: ${logicImplementation}`);

    log('   ✅ 升级成功！');

    log('----------------------------------------------------');
  } catch (error) {
    log('   ❌ 升级失败！');
    console.error(error);
  }

  log('----------------------------------------------------');
};

upgradeNFTAuctionFactory.tags = ['upgrade-nft-auction-factory'];
upgradeNFTAuctionFactory.dependencies = ['nft-auction'];
export default upgradeNFTAuctionFactory;
