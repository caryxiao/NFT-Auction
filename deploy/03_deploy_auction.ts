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
    log('----------------------------------------------------');

    log('6. 创建一个新的拍卖实例...');
    const ddnft = await ethers.getContractAt(
      'DDNFT',
      (await deployments.get('DDNFTProxy')).address,
      deployerSigner
    );

    // 铸造一个 NFT 用于测试
    const mintTx = await ddnft.safeMint(deployer);
    await mintTx.wait();
    log('   ✅ NFT 铸造成功, tokenId: 1');

    // 授权 NFT 给工厂
    const tx = await ddnft.approve(nftAuctionFactoryAddress, 1);
    await tx.wait();
    log('   ✅ NFT 授权成功');

    // 创建拍卖
    const createAuctionTx = await nftAuctionFactoryProxy.createAuction(
      await ddnft.getAddress(),
      1,
      ethers.parseEther('0.1'),
      3600
    );
    const receipt = await createAuctionTx.wait();

    // 从事件中获取新创建的代理地址
    const event = receipt?.logs?.find(
      log =>
        log.address === nftAuctionFactoryAddress &&
        log.eventName === 'AuctionCreated'
    );
    const newAuctionProxyAddress = event?.args?.auctionAddress;

    if (newAuctionProxyAddress) {
      log(`   ✅ 新拍卖代理创建成功: ${newAuctionProxyAddress}`);

      log('7. 升级新的拍卖代理...');
      const NFTAuctionV2 = await ethers.getContractFactory('NFTAuctionV2');
      const upgraded = await upgrades.upgradeProxy(
        newAuctionProxyAddress,
        NFTAuctionV2
      );
      await upgraded.waitForDeployment();
      const upgradedAddress = await upgraded.getAddress();
      log('   ✅ 升级成功！');
      log(
        `   新实现合约地址: ${await upgrades.erc1967.getImplementationAddress(
          upgradedAddress
        )}`
      );
    }
  } catch (error) {
    log(`   ❌ 部署失败: ${error}`);
    throw error;
  }
};

deployNFTAuction.tags = ['nft-auction'];
deployNFTAuction.dependencies = ['ddnft'];

export default deployNFTAuction;
