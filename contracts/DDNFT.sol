// SPDX-License-Identifier: MIT
// 已部署的测试地址: https://sepolia.etherscan.io/address/0x18303e1e6b11a7b6cf566bca5186b397e8b60fc6
pragma solidity ^0.8.30;
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/utils/Strings.sol';

contract DDNFT is ERC721 {
    using Strings for uint256;
    address private manager;
    uint256 private _tokenCounter;

    constructor() ERC721('DD NFT', 'DDN') {
        manager = msg.sender;
    }

    modifier isManager() {
        require(msg.sender == manager, 'Caller is not Manager');
        _;
    }

    function _baseURI() internal pure override returns (string memory) {
        return 'ipfs://bafybeid5ye5dcwff7qpltt7fte2worzsv4izzuq53l5n5hcbyupa26ypfm/';
    }

    function safeMint(address to) external isManager {
        _tokenCounter += 1;
        uint256 tokenId = _tokenCounter;
        _safeMint(to, tokenId);
    }
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? string.concat(baseURI, 'DDNFT_', tokenId.toString(), '.json') : '';
    }
}
