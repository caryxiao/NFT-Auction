# NFT 拍卖平台合约

本项目旨在构建一个基于以太坊的 NFT 拍卖平台。目前项目已完成核心的 NFT 合约（DDNFT）以及可升级的拍卖合约（NFTAuction 和 NFTAuctionFactory）的开发与测试。

## 项目概述

平台的核心由三部分组成：

1.  **DDNFT 合约**：一个符合 ERC-721 标准的可升级 NFT 合约，作为拍卖的标的物。
2.  **NFTAuction 合约**：负责处理单个 NFT 的拍卖逻辑，包括出价、成交、流拍等。这是一个逻辑合约，其实例由工厂合约创建。
3.  **NFTAuctionFactory 合约**：一个工厂合约，负责创建和管理多个 `NFTAuction` 实例。

本项目采用 OpenZeppelin 的 **UUPS (Universal Upgradeable Proxy Standard) 代理模式** 进行合约部署，以确保所有核心合约的逻辑都可以在未来进行升级和迭代。

## 合约功能

### `DDNFT.sol` / `DDNFTV2.sol`

这是项目的核心 NFT 合约，目前已迭代到 V2 版本。

- **符合 ERC-721 标准**：实现了所有标准的 NFT 功能。
- **可升级**：基于 OpenZeppelin UUPS 代理模式，合约逻辑可以随时升级。
- **所有权管理 (`Ownable`)**：只有合约的 `owner` (部署者) 才能执行关键操作。
- **安全铸造 (`safeMint`)**：只有 `owner` 可以铸造新的 NFT。
- **暂停机制 (`Pausable`) (V2 新增)**：`owner` 可以暂停和恢复合约的主要功能（如铸造），以应对紧急情况。

### `NFTAuction.sol` / `NFTAuctionV2.sol`

基础的拍卖逻辑合约，定义了单次拍卖的所有规则和流程。

- **可升级**：采用 UUPS 模式，其逻辑可以被 `owner` 升级。
- **多币种出价**：支持使用原生代币（如 ETH）或任何符合 ERC20 标准的代币进行出价。
- **价格预言机集成 (Chainlink)**：能够接入外部价格预言机，将不同代币的出价转换为统一的 USD 价值进行比较。
- **安全防护**：内置重入保护 (`ReentrancyGuard`)。

### `NFTAuctionFactory.sol` / `NFTAuctionFactoryV2.sol`

负责创建和管理 `NFTAuction` 实例的工厂合约。

- **可升级**：同样采用 UUPS 模式，工厂自身的逻辑（如创建拍卖的方式）也可以升级。
- **实例创建**：通过调用 `createAuction` 函数，为指定的 NFT 创建一个新的 `NFTAuction` 代理合约实例。
- **逻辑分离**：工厂本身不包含复杂的拍卖逻辑，只负责创建和初始化拍卖实例，使得结构更清晰，易于管理和升级。

## 合约升级机制详解

本项目采用了以 **UUPS (Universal Upgradeable Proxy Standard)** 为核心的合约升级方案。UUPS 模式将升级的逻辑（`upgradeTo` 函数）直接实现在逻辑合约本身，与传统的透明代理模式相比，部署成本更低。

### 1. 核心合约与升级模式

- **`NFTAuctionFactory` (工厂合约)**：
  - **角色**：作为创建所有新拍卖实例的入口。
  - **升级方式**：它本身是一个 UUPS 代理。当我们需要修改创建拍卖的逻辑时，可以直接升级 `NFTAuctionFactory` 指向一个新的逻辑合约实现。
- **`NFTAuction` (逻辑合约)**：
  - **角色**：定义了单次拍卖的具体行为和规则。它本身不直接部署为代理，而是作为所有拍卖实例共享的“模板”。
- **拍卖实例 (通过工厂创建的代理)**：
  - **角色**：这些是由 `NFTAuctionFactory` 创建出的、实际执行拍卖的众多代理合约。
  - **升级方式**：每个拍卖代理都是一个独立的 UUPS 代理实例。它在被创建时，会直接指向当时 `NFTAuction` 的逻辑合约地址。

### 2. 当前架构的升级局限性

**重要**：在当前的架构下，当 `NFTAuction` 逻辑合约升级到一个新版本（例如 `NFTAuctionV2`）后，**并不会自动升级所有已经存在的拍卖实例**。

- **新实例**：工厂在升级后创建的**新**拍卖代理，将会指向 `NFTAuctionV2` 的逻辑。
- **旧实例**：所有在升级前就已经创建的拍卖代理，它们仍然指向旧的 `NFTAuction` V1 逻辑合约。它们的行为不会发生任何改变。

### 3. 部署与升级命令示例

- **完整部署 (包括 V1 到 V2 的升级)**：
  ```bash
  npx hardhat deploy
  ```
- **仅部署 DDNFT 合约**：
  ```bash
  npx hardhat deploy --tags ddnft,ddnftv2
  ```
- **仅部署拍卖相关合约**：
  ```bash
  npx hardhat deploy --tags nft-auction
  ```

## 项目结构

```
.
├── contracts/          # Solidity 合约源文件
│   ├── DDNFT.sol
│   ├── DDNFTV2.sol
│   ├── NFTAuction.sol
│   ├── NFTAuctionV2.sol
│   ├── NFTAuctionFactory.sol
│   └── NFTAuctionFactoryV2.sol
├── deploy/             # 部署和升级脚本
│   ├── 01_deploy_ddnft.ts
│   ├── 02_upgrade_ddnft.ts
│   └── 03_deploy_auction.ts
├── test/               # 合约的单元测试
│   ├── DDNFT.test.ts
│   └── NFTAuction.test.ts
├── hardhat.config.ts   # Hardhat 配置文件
└── package.json        # 项目依赖
```
