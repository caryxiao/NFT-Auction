# ERROR

## 项目部署异常问题

项目在Hardhat dev环境可以正常执行`npx hardhat deploy`

在Sepolia环境部署的时候，项目执行`npx hardhat deploy`后， 会报告 `initializeV2`调用错误。

DDNFT 合约使用的是透明代理

NFTAuction 合约使用的是UUPS代理
