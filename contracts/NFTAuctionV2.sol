// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "./NFTAuction.sol";

/**
 * @title NFTAuctionV2
 * @notice An upgraded version of the auction contract.
 */
contract NFTAuctionV2 is NFTAuction {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the V2 contract, calling the parent initializer and setting the version.
     */
    function initialize(
        address _owner,
        address _seller,
        address _nft,
        uint256 _tokenId,
        uint256 _startPrice,
        uint256 _duration
    ) public override initializer {
        __NFTAuction_init(_owner, _seller, _nft, _tokenId, _startPrice, _duration);
        version = 2;
    }

    function getPriceFeed(address _tokenAddr) public view virtual returns (address) {
        // 如果tokenAddr为0, 则返回ETH的价格feed
        if (_tokenAddr == address(0)) {
            return address(priceFeeds[address(0)]); // ETH
        }
        return address(priceFeeds[_tokenAddr]); // ERC20
    }
}
