const { ethers, deployments, getNamedAccounts } = require('hardhat');
const { expect } = require('chai');

describe('DDNFT 合约', () => {
  let ddnft;
  // eslint-disable-next-line no-unused-vars
  let managerSigner, user1Signer, user2Signer;
  let managerAddress, user1Address, user2Address;

  // beforeEach 保证每个测试都有一个纯净的环境。
  beforeEach(async () => {
    // 使用 'DDNFT' 标签部署合约
    await deployments.fixture(['DDNFT']);

    // 获取账户和签名者
    ({
      deployer: managerAddress,
      user1: user1Address,
      user2: user2Address,
    } = await getNamedAccounts());
    managerSigner = await ethers.getSigner(managerAddress);
    user1Signer = await ethers.getSigner(user1Address);
    user2Signer = await ethers.getSigner(user2Address);

    // 获取连接到 manager 的主合约实例
    ddnft = await ethers.getContract('DDNFT', managerSigner);
  });

  describe('部署', () => {
    it('应设置正确的 manager', async () => {
      // 测试私有变量 'manager' 的唯一方法是检查其权限。
      await expect(ddnft.safeMint(managerAddress)).to.not.be.reverted;
    });

    it('应有正确的名称和符号', async () => {
      expect(await ddnft.name()).to.equal('DD NFT');
      expect(await ddnft.symbol()).to.equal('DDN');
    });
  });

  describe('铸造', () => {
    it('应允许 manager 铸造一个 NFT', async () => {
      await ddnft.safeMint(user1Address);
      expect(await ddnft.balanceOf(user1Address)).to.equal(1);
    });

    it('如果非 manager 尝试铸造，则应失败', async () => {
      // 将合约连接到 'user' 签名者，以模拟来自该账户的调用
      await expect(
        ddnft.connect(user1Signer).safeMint(user1Address)
      ).to.be.revertedWith('Caller is not Manager');
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
    it('应允许 manager 授权一个 NFT, 并且 manager 可以转移 NFT', async () => {
      // 获取user连接到合约
      const ddnftUser1 = await ethers.getContract('DDNFT', user1Signer);
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
});
