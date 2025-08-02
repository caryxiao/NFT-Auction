import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';

const deployDDT: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { getNamedAccounts, deployments } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log('----------------------------------------------------');
  log('1. Deploying DDT (ERC20 Token)...');

  const ddt = await deploy('DDT', {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });

  log(`   ✅ DDT deployed to: ${ddt.address}`);

  // Mint some initial tokens to the deployer
  const ddtContract = await ethers.getContractAt('DDT', ddt.address);
  const initialSupply = ethers.parseEther('1000000'); // Mint 1,000,000 DDT
  try {
    const tx = await ddtContract.mint(deployer, initialSupply);
    await tx.wait();
    log(`   ✅ Minted ${ethers.formatEther(initialSupply)} DDT to ${deployer}`);
  } catch (e) {
    log(`   ℹ️  Minting failed or already done.`);
  }

  log('----------------------------------------------------');
};

export default deployDDT;
deployDDT.tags = ['ddt'];
