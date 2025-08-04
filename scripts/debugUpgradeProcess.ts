import { ethers, upgrades } from 'hardhat';

async function main() {
  const proxyAddress = '0x57890F95FD71996f7ce5133e9e06AcfF828A1c2E';

  const [deployer, user1] = await ethers.getSigners();

  console.log('🔍 调试账户:', deployer.address);

  // 获取 DDNFTV2 的合约工厂
  const DDNFTV2 = await ethers.getContractFactory('DDNFTV2');

  // 绑定已部署的代理地址
  const nft = DDNFTV2.attach(proxyAddress);

  const logicAddress =
    await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log('🧩 逻辑合约地址:', logicAddress);

  await nft.initializeV2();

  // 读取版本号
  const version = await nft.version();
  console.log('🧩 合约版本号:', version);

  // 当前合约 owner
  const owner = await nft.owner();
  console.log('👑 合约 Owner:', owner);

  // 尝试 pause 合约
  const pausedBefore = await nft.paused();
  console.log('📌 当前 pause 状态:', pausedBefore);

  if (!pausedBefore) {
    console.log('⏸️ 尝试 pause...');
    const tx = await nft.pause();
    await tx.wait();
    console.log('✅ 已 pause');
  }

  // pause 状态下尝试 mint（应该会失败）
  try {
    console.log('🛠️ 正在 pause 状态下尝试 mint...');
    await nft.safeMint(user1.address);
  } catch (err: any) {
    console.log('🚫 mint 失败（预期）：', err.message);
  }

  // unpause
  console.log('▶️ unpause...');
  await (await nft.unpause()).wait();

  const pausedAfter = await nft.paused();
  console.log('📌 unpause 后 pause 状态:', pausedAfter);

  // 尝试 mint 成功
  console.log('✅ mint...');
  const tx2 = await nft.safeMint(user1.address);
  const receipt = await tx2.wait();
  const transferEvent = receipt.events?.find(e => e.event === 'Transfer');
  const tokenId = transferEvent?.args?.tokenId;

  console.log(`🎉 铸造成功！Token ID: ${tokenId}, 接收者: ${user1.address}`);

  // 查询 tokenURI
  const uri = await nft.tokenURI(tokenId);
  console.log('📦 tokenURI:', uri);
}

main().catch(error => {
  console.error('❌ 调试失败:', error);
  process.exit(1);
});
