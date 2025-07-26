import { ethers, deployments, getNamedAccounts } from 'hardhat';
import { expect } from 'chai';
import { Signer } from 'ethers';

describe('DDNFT 合约', () => {
  let ddnft: any;
  let managerSigner: Signer;
  let user1Signer: Signer;
  // let user2Signer: Signer; // 暂时注释掉未使用的变量
  let managerAddress: string;
  let user1Address: string;
  let user2Address: string;
  let proxyAddress: string;

  // beforeEach 保证每个测试都有一个纯净的环境。
  beforeEach(async () => {
    // 使用 'ddnftv2' 标签部署合约
    await deployments.fixture(['ddnftv2']);

    // 获取账户和签名者
    const namedAccounts = await getNamedAccounts();
    managerAddress = namedAccounts.deployer;
    user1Address = namedAccounts.user1;
    user2Address = namedAccounts.user2;

    managerSigner = await ethers.getSigner(managerAddress);
    user1Signer = await ethers.getSigner(user1Address);
    // user2Signer = await ethers.getSigner(user2Address); // 暂时注释掉未使用的变量

    const proxyDeployment = await deployments.get('DDNFTProxy');
    proxyAddress = proxyDeployment.address;

    // 获取连接到 manager 的主合约实例
    ddnft = await ethers.getContractAt('DDNFTV2', proxyAddress, managerSigner);
  });

  describe('部署', () => {
    it('应设置正确的 owner', async () => {
      expect(await ddnft.owner()).to.equal(managerAddress);
    });

    it('应有正确的名称,符号,版本', async () => {
      expect(await ddnft.name()).to.equal('DD NFT');
      expect(await ddnft.symbol()).to.equal('DDN');
      expect(await ddnft.version()).to.equal('2');
    });
  });

  describe('铸造', () => {
    it('应允许 manager 铸造一个 NFT', async () => {
      await ddnft.safeMint(user1Address);
      expect(await ddnft.balanceOf(user1Address)).to.equal(1);
    });

    it('如果非 owner 尝试铸造，则应失败', async () => {
      // 将合约连接到 'user1' 签名者，以模拟来自该账户的调用
      await expect(
        ddnft.connect(user1Signer).safeMint(user1Address)
      ).to.be.revertedWithCustomError(ddnft, 'OwnableUnauthorizedAccount');
    });

    it('应按顺序递增代币 ID', async () => {
      // 在同一个测试中铸造两个代币
      await ddnft.safeMint(user1Address); // 铸造代币 ID 1
      await ddnft.safeMint(managerAddress); // 铸造代币 ID 2

      // 验证所有者
      expect(await ddnft.ownerOf(1)).to.equal(user1Address);
      expect(await ddnft.ownerOf(2)).to.equal(managerAddress);
    });
  });

  describe('授权管理 NFT', () => {
    it('应允许 owner 授权一个 NFT, 并且 owner 可以转移 NFT', async () => {
      // 获取user连接到合约
      const ddnftUser1 = await ethers.getContractAt(
        'DDNFTV2',
        proxyAddress,
        user1Signer
      );
      await ddnft.safeMint(user1Address);
      await ddnft.safeMint(managerAddress);
      // user授权manager管理NFT
      await ddnftUser1.approve(managerAddress, 1);
      expect(await ddnft.getApproved(1)).to.equal(managerAddress);
      //manager 把user下的NFT转移给user2
      await ddnft.transferFrom(user1Address, user2Address, 1);
      expect(await ddnft.ownerOf(1)).to.equal(user2Address);
    });
  });

  describe('代币 URI', () => {
    it('应返回格式正确的代币 URI', async () => {
      await ddnft.safeMint(user1Address); // 铸造代币 1
      const tokenURI = await ddnft.tokenURI(1);
      const baseURI =
        'ipfs://bafybeid5ye5dcwff7qpltt7fte2worzsv4izzuq53l5n5hcbyupa26ypfm/';
      const expectedURI = `${baseURI}DDNFT_1.json`;
      expect(tokenURI).to.equal(expectedURI);
    });

    it('对于不存在的代币应调用失败', async () => {
      // 预料到调用会失败，因为代币 999 不存在
      await expect(ddnft.tokenURI(999)).to.be.reverted;
    });
  });

  describe('Pausable 功能 (V2)', () => {
    it('应允许 owner 暂停和取消暂停合约', async () => {
      await ddnft.pause();
      expect(await ddnft.paused()).to.be.true;

      await ddnft.unpause();
      expect(await ddnft.paused()).to.be.false;
    });

    it('如果非 owner 尝试暂停，则应失败', async () => {
      await expect(
        ddnft.connect(user1Signer).pause()
      ).to.be.revertedWithCustomError(ddnft, 'OwnableUnauthorizedAccount');
    });

    it('在暂停时应阻止 safeMint', async () => {
      await ddnft.pause();
      await expect(ddnft.safeMint(user1Address)).to.be.revertedWithCustomError(
        ddnft,
        'EnforcedPause'
      );
    });
  });
});
