pragma solidity ^0.8.30;
import '@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol';
contract DDNFTProxyAdmin is ProxyAdmin {
    constructor(address initialOwner) ProxyAdmin(initialOwner) {}
}
