module.exports = async ({ getNamedAccounts, deployments, ethers }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log('----------------------------------------------------');
  log('1. 部署 DDNFT (逻辑合约)...');
  const ddnftLogic = await deploy('DDNFT', {
    from: deployer,
    log: true,
    args: [], // 逻辑合约的 constructor 无参数
  });
  log(`   DDNFT 逻辑合约部署成功: ${ddnftLogic.address}`);

  log('----------------------------------------------------');
  log('2. 部署 ProxyAdmin (代理管理员)...');
  const proxyAdmin = await deploy('DDNFTProxyAdmin', {
    from: deployer,
    log: true,
    args: [deployer],
  });
  log(`   ProxyAdmin 合约部署成功: ${proxyAdmin.address}`);

  log('----------------------------------------------------');
  log('3. 准备初始化数据...');
  const DDNFT = await ethers.getContractAt('DDNFT', ddnftLogic.address);
  const initData = DDNFT.interface.encodeFunctionData('initialize', [
    'DD NFT',
    'DDN',
    deployer,
  ]);
  log('   初始化数据已生成');

  log('----------------------------------------------------');
  log('4. 部署 DDNFTProxy (透明代理合约)...');
  const ddnftProxy = await deploy('DDNFTProxy', {
    from: deployer,
    log: true,
    args: [ddnftLogic.address, proxyAdmin.address, initData],
  });
  log(`   DDNFTProxy 部署成功: ${ddnftProxy.address}`);
  log('----------------------------------------------------');

  // 最终验证
  const proxyInstance = await ethers.getContractAt('DDNFT', ddnftProxy.address);
  const owner = await proxyInstance.owner();
  log(`部署完成!`);
  log(`   代理合约地址 (用户交互地址): ${ddnftProxy.address}`);
  log(`   代理合约 Owner (管理员): ${owner}`);
  log(`   部署者地址: ${deployer}`);
  if (owner.toLowerCase() !== deployer.toLowerCase()) {
    log('   警告：代理合约的 owner 与部署者不匹配！');
  }
};

module.exports.tags = ['ddnft'];
