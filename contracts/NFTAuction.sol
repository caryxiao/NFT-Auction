// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/**
 * @title NFTAuction
 * @notice 拍卖合约, 拍卖NFT, 支持ETH和ERC20代币出价, 合约是以USD为单位的拍卖合约, 出价都需要转换为USD进行对比价格
 */
contract NFTAuction is Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuard {
    // 最小持续时间
    uint256 public constant MIN_DURATION = 60;
    enum PaymentType {
        ETH,
        ERC20
    }

    IERC721 public nft; // nft合约
    uint256 public tokenId; //拍卖的Token ID
    address public seller; //卖家
    uint256 public startTime; //拍卖开始时间
    uint256 public startPrice; //起拍价格, 单位USD
    uint256 public duration; //拍卖持续时间, 拍卖结束时间等于 startTime + duration
    bool public ended; //拍卖是否结束
    // bidder
    address public highestBidder; // 最高出价者
    uint256 public highestAmount; //最高出价, 单位USD
    PaymentType public highestBidPayment; //最高出价者的支付类型
    uint256 public highestBidOriginalAmount; //最高出价原始金额
    address public highestBidTokenAddr; //最高出价者支付的代币地址
    // 提现金额, 如果tokenAddr是address(0), 则表示提现ETH, 否则表示提现ERC20代币
    mapping(address bidder => mapping(address tokenAddr => uint256 amount)) public withdrawals;

    // 价格预言机
    mapping(address tokenAddr => AggregatorV3Interface priceFeed) public priceFeeds;
    // 心跳阈值
    mapping(address feedAddr => uint256 threshold) public heartbeatThresholds;

    // 无效地址
    error InvalidAddress(address addr);
    // 无效的代币地址
    error InvalidTokenAddress(address addr);
    // 无效的起拍价
    error InvalidStartPrice(uint256 price);
    // 无效的拍卖持续时间
    error InvalidDuration(uint256 allowed, uint256 current);
    // 无效的NFT合约地址
    error InvalidERC721Contract(address contractAddr);
    // 无效的价格预言机
    error InvalidPriceFeed(address priceFeed);
    // 无效的价格
    error InvalidStalePrice(address feedAddr, int256 price, uint256 updatedAt, uint256 threshold);
    // 无效的心跳阈值
    error InvalidHeartbeatThreshold(uint256 threshold);
    // 拍卖已结束
    error InvalidAuctionState();
    // 无效的出价金额
    error InvalidBidAmount(uint256 amount, uint256 originalAmount);
    // 无效的出价者
    error InvalidBidder(address bidder, address highestBidder);
    // 转账失败
    error TransferFailed(address to, uint256 amount);
    // 提现
    event Withdraw(address indexed bidder, address indexed tokenAddr, uint256 amount);
    // 价格预言机更新
    event PriceFeedUpdated(address indexed tokenAddr, address indexed priceFeed);
    // 出价
    event Bid(address indexed bidder, uint256 bidAmount, uint256 originalAmount, PaymentType paymentType);
    // 拍卖结束
    event AuctionEnded(address indexed bidder, uint256 bidAmount, PaymentType paymentType, uint256 originalAmount);

    /**
     * @dev 初始化合约
     */
    function initialize(address _nft, uint256 _tokenId, uint256 _startPrice, uint256 _duration) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        _createAuction(_nft, _tokenId, _startPrice, _duration);
    }

    /**
     * @dev 升级合约
     * @param newImplementation 新的合约地址
     */
    function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner {
        if (address(newImplementation) == address(0)) {
            revert InvalidAddress(address(0));
        }
    }

    /**
     * @dev 创建拍卖
     * @param _nft nft合约地址
     * @param _tokenId nft tokenId
     * @param _startPrice 起拍价
     * @param _duration 持续时间
     */
    function _createAuction(address _nft, uint256 _tokenId, uint256 _startPrice, uint256 _duration) internal virtual {
        // 检查起拍价是否大于0
        if (_startPrice <= 0) {
            revert InvalidStartPrice(_startPrice);
        }

        // 检查持续时间是否大于等于最小持续时间
        if (_duration < MIN_DURATION) {
            revert InvalidDuration(MIN_DURATION, _duration);
        }

        // 检查nft合约地址是否有效
        if (!_isERC721(_nft)) {
            revert InvalidERC721Contract(_nft);
        }

        // 将要拍卖的token转移到当前合约
        IERC721(_nft).safeTransferFrom(msg.sender, address(this), tokenId);

        // 初始化拍卖信息
        nft = IERC721(_nft);
        tokenId = _tokenId;
        seller = msg.sender;
        startTime = block.timestamp;
        startPrice = _startPrice;
        duration = _duration;
    }

    /**
     * @dev 设置价格预言机
     * @param _tokenAddr 代币地址
     * @param _priceFeed 价格预言机地址
     */
    function setPriceFeeds(address _tokenAddr, address _priceFeed, uint256 _threshold) external virtual onlyOwner {
        if (_tokenAddr == address(0)) {
            revert InvalidTokenAddress(_tokenAddr);
        }
        if (_priceFeed == address(0)) {
            revert InvalidPriceFeed(_priceFeed);
        }

        if (_threshold <= 0) {
            revert InvalidHeartbeatThreshold(_threshold);
        }

        // 检查价格预言机是否有效
        try AggregatorV3Interface(_priceFeed).version() returns (uint256 version) {
            if (version == 0) {
                revert InvalidPriceFeed(_priceFeed);
            }
        } catch {
            revert InvalidPriceFeed(_priceFeed);
        }
        priceFeeds[_tokenAddr] = AggregatorV3Interface(_priceFeed);
        heartbeatThresholds[_priceFeed] = _threshold;
        emit PriceFeedUpdated(_tokenAddr, _priceFeed);
    }

    function bidWithERC20(uint256 amount, address tokenAddress) external virtual nonReentrant {
        _bid(PaymentType.ERC20, tokenAddress, amount);
    }

    function bidWithETH() external payable virtual nonReentrant {
        _bid(PaymentType.ETH, address(0), msg.value);
    }

    function _bid(PaymentType _paymentType, address _tokenAddress, uint256 _amount) internal virtual {
        // 判断拍卖是否结束了
        if (ended) {
            revert InvalidAuctionState();
        }

        // 获取最新价格
        uint256 latestPrice = _getLatestPrice(_tokenAddress, _amount);
        // 检查出价是否大于起拍价
        if (latestPrice < startPrice) {
            revert InvalidStartPrice(latestPrice);
        }

        // 如果出价高于最高出价，则更新最高出价
        if (latestPrice > highestAmount) {
            // 如果之前有人出价，则将之前出价者的钱写入withdrawals
            if (highestAmount > 0) {
                if (highestBidPayment == PaymentType.ETH) {
                    withdrawals[highestBidder][address(0)] += highestAmount;
                } else {
                    withdrawals[highestBidder][_tokenAddress] += highestBidOriginalAmount;
                }
            }

            // 如果支付类型是ERC20，则从出价者收取代币, ETH 会自动收取
            if (_paymentType == PaymentType.ERC20) {
                IERC20(_tokenAddress).transferFrom(msg.sender, address(this), _amount);
                // 如果出价者没有提现过该代币，则将代币地址添加到提现列表中
            }

            highestAmount = latestPrice;
            highestBidder = msg.sender;
            highestBidPayment = _paymentType;
            highestBidOriginalAmount = _amount;
            highestBidTokenAddr = _tokenAddress;
            // 触发出价事件
            emit Bid(msg.sender, latestPrice, _amount, _paymentType);
        } else {
            // 如果出价低于最高出价，则抛出异常
            revert InvalidBidAmount(_amount, latestPrice);
        }
    }

    /**
     * @dev 获取价格预言机
     * @param _tokenAddr 代币地址
     * @return priceFeed 价格预言机
     */
    function _getPriceFeed(address _tokenAddr) internal view virtual returns (AggregatorV3Interface) {
        return priceFeeds[_tokenAddr];
    }

    /**
     * @dev 从价格预言机获取最新价格
     * @param _tokenAddr 代币地址
     * @return feedPrice 价格
     * @return feedDecimals 价格的小数位数
     */
    function _getLatestPriceFromFeed(
        address _tokenAddr
    ) internal view virtual returns (int256 feedPrice, uint8 feedDecimals) {
        // 获取价格预言机
        AggregatorV3Interface priceFeed = _getPriceFeed(_tokenAddr);
        // 获取最新价格
        (, int256 price, , uint256 updatedAt, ) = priceFeed.latestRoundData();
        // 检查价格是否有效
        // 价格小于0或者更新时间超过心跳阈值
        // 如果价格无效，则抛出异常
        if (price < 0 || block.timestamp - updatedAt > heartbeatThresholds[address(priceFeed)]) {
            revert InvalidStalePrice(address(priceFeed), price, updatedAt, heartbeatThresholds[address(priceFeed)]);
        }
        // 返回价格和小数位数
        return (price, priceFeed.decimals());
    }

    /**
     * @dev 获取最新价格
     * @param _tokenAddr 代币地址
     * @param _amount 数量
     * @return 价格
     */
    function _getLatestPrice(address _tokenAddr, uint256 _amount) internal view virtual returns (uint256) {
        // 获取最新价格和小数位数
        (int256 price, uint8 decimals) = _getLatestPriceFromFeed(_tokenAddr);
        // 返回价格
        return (_amount * uint256(price)) / (10 ** decimals);
    }

    /**
     * @dev 检查是否是有效的ERC721合约
     * @param addr 合约地址
     * @return 是否是有效的ERC721合约
     */
    function _isERC721(address addr) internal view virtual returns (bool) {
        if (addr.code.length == 0) {
            return false;
        }
        // 检测是否是有效的合约
        // 如果合约有效，则返回true
        // 如果合约无效，则返回false
        try IERC165(addr).supportsInterface(0x80ac58cd) returns (bool isSupported) {
            return isSupported;
        } catch {
            return false;
        }
    }

    /**
     * @dev 结束拍卖
     */
    function endAuction() external virtual nonReentrant {
        _endAuction();
    }

    /**
     * @dev 结束拍卖
     */
    function _endAuction() internal virtual {
        if (ended) {
            revert InvalidAuctionState();
        }

        // 如果拍卖截止时间大于当前区块时间, 则拍卖还未结束
        if (startTime + duration > block.timestamp) {
            revert InvalidAuctionState();
        }

        ended = true;

        // 如果最高出价者不为空, 则将最高出价者的钱写入withdrawals
        if (highestBidder != address(0)) {
            // 将最高出价者的钱写入withdrawals
            if (highestBidPayment == PaymentType.ETH) {
                withdrawals[highestBidder][address(0)] += highestAmount;
            } else {
                withdrawals[highestBidder][highestBidTokenAddr] += highestBidOriginalAmount;
            }
            emit AuctionEnded(highestBidder, highestAmount, highestBidPayment, highestBidOriginalAmount);
        }
    }

    /**
     * @dev 领取NFT
     */
    function claimNFT() external virtual nonReentrant {
        if (!ended) {
            revert InvalidAuctionState();
        }
        if (msg.sender != highestBidder) {
            revert InvalidBidder(msg.sender, highestBidder);
        }
        _transferNFT();
    }

    /**
     * @dev 转移NFT
     */
    function _transferNFT() internal virtual {
        nft.safeTransferFrom(address(this), highestBidder, tokenId);
    }

    /**
     * @dev 提现
     */
    function withdraw(address _tokenAddress) external virtual nonReentrant {}

    /**
     * @dev 提现
     */
    function _withdraw(address _tokenAddress) internal virtual {
        // 检查拍卖是否结束
        if (!ended) {
            revert InvalidAuctionState();
        }
        uint256 amount = withdrawals[msg.sender][_tokenAddress];
        withdrawals[msg.sender][_tokenAddress] = 0;
        if (_tokenAddress == address(0)) {
            (bool success, ) = msg.sender.call{value: amount}("");
            if (!success) {
                revert TransferFailed(msg.sender, amount);
            }
        } else {
            IERC20(_tokenAddress).transfer(msg.sender, amount);
        }
        emit Withdraw(msg.sender, _tokenAddress, amount);
    }

    /**
     * @dev 接收ERC721代币, 接收拍卖的NFT
     * @param operator 操作员
     * @param from 发送者
     * @param tokenId tokenId
     * @param data 数据
     * @return bytes4 返回值
     */
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes memory data
    ) public virtual returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
