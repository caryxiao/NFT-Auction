pragma solidity ^0.8.30;
import '@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol';
contract DDNFTProxy is TransparentUpgradeableProxy {
    constructor(
        address _logic,
        address _admin,
        bytes memory _data
    ) payable TransparentUpgradeableProxy(_logic, _admin, _data) {}
}
