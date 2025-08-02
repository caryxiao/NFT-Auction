import { ethers, deployments } from 'hardhat';
import { expect } from 'chai';
import { Signer } from 'ethers';
import { DDNFTV2, NFTAuctionFactory } from '../typechain-types';

describe('NFT Auction Test', () => {
  let nftAuctionFactory: NFTAuctionFactory;
  let deployerSigner: Signer;
  let sellerSigner: Signer;
  let buyer1Signer: Signer;
  let buyer2Signer: Signer;
  let buyer3Signer: Signer;
  let sellerAddress: string;
  let buyer1Address: string;
  let buyer2Address: string;
  let buyer3Address: string;
  let ddnft: any;
  let priceFeed1: any;
  let priceFeed2: any;
  let ddt: any; // 测试使用的代币
  const nftTokenId1 = 1;
  const nftTokenId2 = 2;

  beforeEach(async () => {
    await deployments.fixture(['mocks', 'ddnftv2', 'nft-auction']);

    const [deployer, user1, user2, user3, user4] = await ethers.getSigners();

    deployerSigner = deployer;
    sellerSigner = user1;
    buyer1Signer = user2;
    buyer2Signer = user3;
    buyer3Signer = user4;
    sellerAddress = await sellerSigner.getAddress();
    buyer1Address = await buyer1Signer.getAddress();
    buyer2Address = await buyer2Signer.getAddress();
    buyer3Address = await buyer3Signer.getAddress();

    const ddnftDeployment = await deployments.get('DDNFTProxy');
    ddnft = await ethers.getContractAt('DDNFT', ddnftDeployment.address);

    const NFTAuctionFactoryDeployment =
      await deployments.get('NFTAuctionFactory');

    nftAuctionFactory = await ethers.getContractAt(
      'NFTAuctionFactory',
      NFTAuctionFactoryDeployment.address
    );

    // 设置AggregatorV3Interface的Mock
    const MockPriceFeed1Deployment = await deployments.get('MockPriceFeed1');
    priceFeed1 = await ethers.getContractAt(
      'MockV3Aggregator',
      MockPriceFeed1Deployment.address
    );

    const MockPriceFeed2Deployment = await deployments.get('MockPriceFeed2');
    priceFeed2 = await ethers.getContractAt(
      'MockV3Aggregator',
      MockPriceFeed2Deployment.address
    );

    const DDTDeployment = await deployments.get('DDT');
    ddt = await ethers.getContractAt('DDT', DDTDeployment.address);
    await ddt.mint(sellerAddress, 100000);
    await ddt.mint(buyer1Address, 100000);
    await ddt.mint(buyer2Address, 100000);
    await ddt.mint(buyer3Address, 100000);
  });

  describe('测试合约竞拍', () => {
    let auction1Address: string;
    let auction1: any;
    beforeEach(async () => {
      // 创建2个NFT
      await ddnft.safeMint(sellerAddress);
      await ddnft.safeMint(sellerAddress);

      // 授权NFT给工厂合约
      await ddnft
        .connect(sellerSigner)
        .approve(nftAuctionFactory.target, nftTokenId1);

      // 设置NFT的拍卖信息
      await nftAuctionFactory
        .connect(sellerSigner)
        .createAuction(ddnft.target, nftTokenId1, 10, BigInt(1000));

      // 获取 AuctionCreated 事件
      const filter = nftAuctionFactory.filters.AuctionCreated(sellerAddress);
      const events = await nftAuctionFactory.queryFilter(filter);
      auction1Address = events[0].args.auction;

      // 给拍卖合约设置PriceFeed, 通过auction1Address来进行设置
      auction1 = await ethers.getContractAt('NFTAuction', auction1Address);
      // 0地址, 表示ETH
      await auction1.setPriceFeed(ethers.ZeroAddress, priceFeed1.target, 1000);
      // 设置DDT的PriceFeed
      await auction1.setPriceFeed(ddt.target, priceFeed2.target, 1000);
    });

    it('测试拍卖设置是否正确', async () => {
      // 验证tokenId1的owner是否为拍卖合约地址, tokenId2的owner是否为卖家地址
      expect(await ddnft.ownerOf(nftTokenId1)).to.equal(auction1Address);
      // 验证tokenId2的owner是否为卖家地址
      expect(await ddnft.ownerOf(nftTokenId2)).to.equal(sellerAddress);
      // ERC20是否创建创建正确
      expect(await ddt.balanceOf(buyer1Address)).to.equal(100000);
      expect(await ddt.balanceOf(buyer2Address)).to.equal(100000);
      expect(await ddt.balanceOf(buyer3Address)).to.equal(100000);
    });

    it('测试竞拍流程', async () => {
      // 买家1出价
      await ddt.connect(buyer1Signer).approve(auction1.target, 100);
      await auction1.connect(buyer1Signer).bidWithERC20(100, ddt.target);
      expect(await auction1.highestBidder()).to.equal(buyer1Address);
      // 应该是等于预言机计算的值转换的USD值， 根据Mocks计算， 使用的是PriceFeed2的值
      expect(await auction1.highestAmount()).to.equal(500);
      expect(await auction1.highestBidTokenAddr()).to.equal(ddt.target);
      expect(await auction1.highestBidOriginalAmount()).to.equal(100);
      // 买家2出价
      await ddt.connect(buyer2Signer).approve(auction1.target, 300);
      await auction1.connect(buyer2Signer).bidWithERC20(300, ddt.target);
      expect(await auction1.highestBidder()).to.equal(buyer2Address);
      expect(await auction1.highestAmount()).to.equal(1500);
      expect(await auction1.highestBidTokenAddr()).to.equal(ddt.target);
      expect(await auction1.highestBidOriginalAmount()).to.equal(300);
      // 卖家1待退款金额

      await expect(
        auction1.connect(buyer1Signer).withdraw(ddt.target)
      ).to.be.revertedWithCustomError(auction1, 'InvalidAuctionState');
      await expect(
        auction1.connect(buyer1Signer).withdraw(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(auction1, 'InvalidAuctionState');

      // 卖家1重新出价, 低于卖家2的出价， 应该会失败
      await expect(
        auction1.connect(buyer1Signer).bidWithERC20(200, ddt.target)
      ).to.be.revertedWithCustomError(auction1, 'InvalidBidAmount');

      // 卖家1重新出价, 高于卖家2的出价， 应该会成功
      await ddt.connect(buyer1Signer).approve(auction1.target, 400);
      await auction1.connect(buyer1Signer).bidWithERC20(400, ddt.target);
      expect(await auction1.highestBidder()).to.equal(buyer1Signer);
      expect(await auction1.highestAmount()).to.equal(2000);
      expect(await auction1.highestBidTokenAddr()).to.equal(ddt.target);
      expect(await auction1.highestBidOriginalAmount()).to.equal(400);

      // 卖家2以ETH出价
      await auction1.connect(buyer2Signer).bidWithETH({
        value: ethers.parseEther('0.002'),
      });
      expect(await auction1.highestBidder()).to.equal(buyer2Address);
      expect(await auction1.highestAmount()).to.equal(16000000000000000n);
      expect(await auction1.highestBidTokenAddr()).to.equal(ethers.ZeroAddress);
      expect(await auction1.highestBidOriginalAmount()).to.equal(
        ethers.parseEther('0.002')
      );

      // 买家3出价
      await auction1.connect(buyer3Signer).bidWithETH({
        value: ethers.parseEther('0.003'),
      });
      expect(await auction1.highestBidder()).to.equal(buyer3Address);
      // 需要用PriceFeed1来计算, 根据Mocks计算， 使用的是PriceFeed1的值， 0.0008, 这个是ETH的值, 所以需要转换USD的值
      expect(await auction1.highestAmount()).to.equal(24000000000000000n);
      expect(await auction1.highestBidTokenAddr()).to.equal(ethers.ZeroAddress);
      expect(await auction1.highestBidOriginalAmount()).to.equal(
        ethers.parseEther('0.003')
      );

      // 结束拍卖
      await ethers.provider.send('evm_increaseTime', [1001]);
      await ethers.provider.send('evm_mine', []);
      await auction1.endAuction();
      expect(await auction1.ended()).to.be.true;

      // 买家1可以提现, ETC提取为0,会报错，因为无提现额度, ERC20可以提取已经出价的金额
      await expect(
        auction1.connect(buyer1Signer).withdraw(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(auction1, 'InvalidWithdrawAmount');

      await auction1.connect(buyer1Signer).withdraw(ddt.target);
      expect(await ddt.balanceOf(buyer1Address)).to.equal(100000);

      // 买家2可以提现, ETC 和 ERC20都可以提现
      await auction1.connect(buyer2Signer).withdraw(ddt.target);
      expect(await ddt.balanceOf(buyer2Address)).to.equal(100000);
      const buyer2BalanceBefore =
        await ethers.provider.getBalance(buyer2Address);
      const tx2 = await auction1
        .connect(buyer2Signer)
        .withdraw(ethers.ZeroAddress);
      const receipt2 = await tx2.wait();
      const gasUsed2 = receipt2.gasUsed! * receipt2.gasPrice!;
      const buyer2BalanceAfter =
        await ethers.provider.getBalance(buyer2Address);
      expect(buyer2BalanceAfter).to.equal(
        buyer2BalanceBefore + ethers.parseEther('0.002') - BigInt(gasUsed2)
      );

      // 卖家可以提取 winer 的 ETH
      const sellerBalanceBefore =
        await ethers.provider.getBalance(sellerAddress);
      const tx = await auction1
        .connect(sellerSigner)
        .withdraw(ethers.ZeroAddress);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed! * receipt.gasPrice!;
      const sellerBalanceAfter =
        await ethers.provider.getBalance(sellerAddress);
      expect(sellerBalanceAfter).to.equal(
        sellerBalanceBefore + ethers.parseEther('0.003') - BigInt(gasUsed)
      );

      // 赢家可以领取NFT
      await auction1.connect(buyer3Signer).claimNFT();
      expect(await ddnft.ownerOf(nftTokenId1)).to.equal(buyer3Address);
    });
  });
});
