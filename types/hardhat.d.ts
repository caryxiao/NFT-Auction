// 扩展 Hardhat 类型定义以支持 upgrades 对象的智能提示

/**
 * @typedef {Object} ERC1967
 * @property {function(string): Promise<string>} getAdminAddress - 获取代理管理员地址
 * @property {function(string): Promise<string>} getImplementationAddress - 获取实现合约地址
 * @property {function(string): Promise<string>} getBeaconAddress - 获取信标地址
 */

/**
 * @typedef {Object} BeaconUtils
 * @property {function(string): Promise<string>} getImplementationAddress - 获取信标实现地址
 */

/**
 * @typedef {Object} AdminUtils
 * @property {function} changeProxyAdmin - 更改代理管理员
 * @property {function} transferProxyAdminOwnership - 转移代理管理员所有权
 */

/**
 * @typedef {Object} HardhatUpgrades
 * @property {function} deployProxy - 部署可升级代理
 * @property {function} upgradeProxy - 升级代理
 * @property {function} validateImplementation - 验证实现合约
 * @property {function} validateUpgrade - 验证升级
 * @property {function} deployImplementation - 部署实现合约
 * @property {function} prepareUpgrade - 准备升级
 * @property {function} deployBeacon - 部署信标
 * @property {function} deployBeaconProxy - 部署信标代理
 * @property {function} upgradeBeacon - 升级信标
 * @property {function} forceImport - 强制导入
 * @property {function} silenceWarnings - 静默警告
 * @property {AdminUtils} admin - 管理员工具
 * @property {ERC1967} erc1967 - ERC1967 工具
 * @property {BeaconUtils} beacon - 信标工具
 */

// 全局声明，让 require('hardhat') 解构出的 upgrades 对象有类型提示
declare global {
  /**
   * @type {HardhatUpgrades}
   */
  const upgrades: any;
}