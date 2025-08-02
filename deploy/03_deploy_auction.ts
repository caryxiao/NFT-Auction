import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deployNFTAuction: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployments, getNamedAccounts, ethers, upgrades } = hre;
  const { deployer } = await getNamedAccounts();
  const deployerSigner = await ethers.getSigner(deployer);

  const { log, save } = deployments;

  log('----------------------------------------------------');
  try {
    log('deployer: ', deployer);
    log('1. 获取 NFTAuction 合约...');
    const NFTAuctionContract = await ethers.getContractFactory(
      'NFTAuction',
      deployerSigner
    );
    log('2. 部署 NFTAuction 合约...');
    const nftAuction = await NFTAuctionContract.deploy();
    await nftAuction.waitForDeployment();
    const nftAuctionAddress = await nftAuction.getAddress();
    log('nftAuctionAddress: ', nftAuctionAddress);

    log('3. 获取 NFTActionFactory 合约...');
    const NFTAuctionFactoryContract = await ethers.getContractFactory(
      'NFTAuctionFactory',
      deployerSigner
    );
    log('4. 部署 NFTActionFactory 合约...');
    const nftAuctionFactoryProxy = await upgrades.deployProxy(
      NFTAuctionFactoryContract,
      [nftAuctionAddress],
      {
        initializer: 'initialize',
        kind: 'uups',
      }
    );
    await nftAuctionFactoryProxy.waitForDeployment();
    const nftAuctionFactoryAddress = await nftAuctionFactoryProxy.getAddress();

    log('5. 验证部署结果...');
    log('----------------------------------------------------');
    log(`   ✅ NFTAuction 合约部署成功: ${nftAuctionAddress}`);
    log(`   ✅ NFTAuctionFactory 合约部署成功: ${nftAuctionFactoryAddress}`);

    // 保存部署结果
    save('NFTAuction', {
      address: nftAuctionAddress,
      abi: JSON.parse(NFTAuctionContract.interface.formatJson()),
    });
    save('NFTAuctionFactory', {
      address: nftAuctionFactoryAddress,
      abi: JSON.parse(NFTAuctionFactoryContract.interface.formatJson()),
    });

    log('----------------------------------------------------');
    log('🎉 部署完成！');
  } catch (error) {
    log(`   ❌ 部署失败: ${error}`);
    throw error;
  }
};

deployNFTAuction.tags = ['nft-auction'];
deployNFTAuction.dependencies = [];

export default deployNFTAuction;
