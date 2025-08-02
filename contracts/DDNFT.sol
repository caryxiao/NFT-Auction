// SPDX-License-Identifier: MIT
// 已部署的测试地址: https://sepolia.etherscan.io/address/0x18303e1e6b11a7b6cf566bca5186b397e8b60fc6
pragma solidity ^0.8.30;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

contract DDNFT is ERC721Upgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    using Strings for uint256;
    uint256 private _tokenCounter;

    // 事件：记录铸造操作
    event Mint(address indexed to, uint256 indexed tokenId);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers(); // 禁止直接部署逻辑合约
    }

    function initialize(string memory _name, string memory _symbol, address _initialOwner) public initializer {
        __ERC721_init(_name, _symbol);
        __Ownable_init(_initialOwner);
        __ReentrancyGuard_init();
    }

    function _baseURI() internal pure virtual override returns (string memory) {
        return "ipfs://bafybeid5ye5dcwff7qpltt7fte2worzsv4izzuq53l5n5hcbyupa26ypfm/";
    }

    function safeMint(address to) public virtual onlyOwner nonReentrant {
        _tokenCounter += 1;
        uint256 tokenId = _tokenCounter;
        _safeMint(to, tokenId);
        emit Mint(to, tokenId); // 触发 Mint 事件
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireOwned(tokenId);
        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? string.concat(baseURI, "DDNFT_", tokenId.toString(), ".json") : "";
    }

    function version() public pure virtual returns (string memory) {
        return "1";
    }
}
