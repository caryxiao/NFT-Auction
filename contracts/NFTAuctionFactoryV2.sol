// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./NFTAuctionFactory.sol";
import "./NFTAuctionV2.sol";

contract NFTAuctionFactoryV2 is NFTAuctionFactory {
    /**
     * @dev 初始化合约
     */
    function initializeV2() public reinitializer(2) {
        version = 2;
    }

    /**
     * @dev 获取卖家拍卖列表
     * @param _seller 卖家地址
     * @return 拍卖列表
     */
    function getSellerAuctions(address _seller) public view returns (address[] memory) {
        return auctionList[_seller];
    }
}
