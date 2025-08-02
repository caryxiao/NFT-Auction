import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deployMocks: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployments, getNamedAccounts, network, ethers } = hre;
  const { deploy, log, save } = deployments;
  const { deployer } = await getNamedAccounts();
  const deployerSigner = await ethers.getSigner(deployer);

  if (network.name === 'hardhat' || network.name === 'localhost') {
    log('----------------------------------------------------');
    log('Deploying MockV3Aggregator...');
    const Mock1 = await ethers.getContractFactory(
      'MockV3Aggregator',
      deployerSigner
    );
    const priceFeed1 = await Mock1.deploy(8, 800000000);
    await priceFeed1.waitForDeployment();
    const Mock2 = await ethers.getContractFactory(
      'MockV3Aggregator',
      deployerSigner
    );
    const priceFeed2 = await Mock2.deploy(8, 500000000);
    await priceFeed2.waitForDeployment();
    log('Mocks Deployed!');
    log('----------------------------------------------------');
    save('MockPriceFeed1', {
      address: await priceFeed1.getAddress(),
      abi: JSON.parse(Mock1.interface.formatJson()),
    });
    save('MockPriceFeed2', {
      address: await priceFeed2.getAddress(),
      abi: JSON.parse(Mock2.interface.formatJson()),
    });

    log('----------------------------------------------------');
    log('Deploying DDT...');
    const DDT = await ethers.getContractFactory('DDT', deployerSigner);
    const ddt = await DDT.deploy();
    await ddt.waitForDeployment();
    save('DDT', {
      address: await ddt.getAddress(),
      abi: JSON.parse(DDT.interface.formatJson()),
    });
    log('DDT Deployed!');
    log('----------------------------------------------------');
  }
};

export default deployMocks;
deployMocks.tags = ['mocks'];
