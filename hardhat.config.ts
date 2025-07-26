import '@nomicfoundation/hardhat-toolbox';
import '@openzeppelin/hardhat-upgrades';
import 'hardhat-deploy';
import { HardhatUserConfig } from 'hardhat/config';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// 根据 NODE_ENV 自动选择 .env 文件
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else {
  console.warn(`环境文件 ${envFile} 不存在，使用默认 .env`);
  dotenv.config();
}

const { INFURA_API_KEY, PRIVATE_KEY } = process.env;
console.log('当前环境:', process.env.NODE_ENV || 'development');

const config: HardhatUserConfig = {
  solidity: '0.8.30',
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
  namedAccounts: {
    deployer: 0,
    user1: 1,
    user2: 2,
  },
  typechain: {
    outDir: 'typechain-types',
    target: 'ethers-v6',
  },
};

export default config;
