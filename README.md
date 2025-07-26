# NFT 拍卖平台合约

本项目旨在构建一个基于以太坊的 NFT 拍卖平台。目前项目处于早期开发阶段，已完成核心的 NFT 合约（DDNFT）的开发与测试。

## 项目概述

平台的核心由两部分组成：
1.  **DDNFT 合约**：一个符合 ERC-721 标准的可升级 NFT 合约，作为拍卖的标的物。
2.  **NFTAuction 合约 (待开发)**：负责处理 NFT 的拍卖逻辑，包括出价、成交、流拍等。

本项目采用 OpenZeppelin 的**透明代理模式 (Transparent Proxy Pattern)** 进行合约部署，以确保合约逻辑可以在未来进行升级和迭代。

## 合约功能

### `DDNFT.sol` / `DDNFTV2.sol`

这是项目的核心 NFT 合约，目前已迭代到 V2 版本。

-   **符合 ERC-721 标准**：实现了所有标准的 NFT 功能。
-   **可升级**：基于 OpenZeppelin UUPS 透明代理模式，合约逻辑可以随时升级。
-   **所有权管理 (`Ownable`)**：只有合约的 `owner` (部署者) 才能执行关键操作。
-   **安全铸造 (`safeMint`)**：只有 `owner` 可以铸造新的 NFT。
-   **暂停机制 (`Pausable`) (V2 新增)**：`owner` 可以暂停和恢复合约的主要功能（如铸造），以应对紧急情况。
-   **自动递增 Token ID**：确保每个 NFT 都有一个唯一的 ID。
-   **固定的 Base URI**：为所有 NFT 提供一个统一的元数据基础路径。

## 使用说明

### 1. 安装依赖

在项目根目录下运行：
```bash
npm install
```

### 2. 编译合约

```bash
npx hardhat compile
```

### 3. 运行测试

本项目的测试覆盖了 `DDNFT` 合约的部署、铸造、权限、授权以及 V2 的暂停功能。运行以下命令来执行测试：
```bash
npx hardhat test
```

### 4. 部署与升级

部署脚本位于 `deploy/` 目录下，并使用 `hardhat-deploy` 插件进行管理。

运行以下命令将在本地网络部署 `DDNFT` 的 V1 版本，并立即将其升级到 V2 版本：
```bash
npx hardhat deploy --tags ddnft,ddnftv2
```

## 项目结构

```
.
├── contracts/      # Solidity 合约源文件
│   ├── DDNFT.sol
│   └── DDNFTV2.sol
├── deploy/         # 部署和升级脚本
│   ├── 01_deploy_ddnft.js
│   └── 02_upgrade_ddnft.js
├── test/           # 合约的单元测试
│   └── DDNFT.test.js
├── hardhat.config.js # Hardhat 配置文件
└── package.json    # 项目依赖
```

## 下一步计划

-   [ ] 开发 `NFTAuction.sol` 合约，实现完整的拍卖逻辑。
-   [ ] 为 `NFTAuction.sol` 编写部署脚本和单元测试。
-   [ ] 完善前后端交互接口。
