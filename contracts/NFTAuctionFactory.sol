// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./NFTAuction.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title NFTAuctionFactory
 * @author
 * @notice 客户需要先把token授权给NFT AucFactory, NFT AucFactory 将NFT 发送到代理合约, 然后代理合约将NFT 发送到拍卖合约
 */
contract NFTAuctionFactory is Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    address public logicImplementation;
    uint256 public version;
    mapping(address seller => address[] auctions) public auctionList;

    event AuctionCreated(address indexed seller, address indexed auction);

    error InvalidSeller(address seller);
    error InvalidAddress(address addr);

    // 只有卖家可以创建拍卖
    modifier onlySeller() {
        if (msg.sender == address(0)) {
            revert InvalidSeller(msg.sender);
        }
        _;
    }

    /**
     * @dev 初始化工厂
     * @param _logicImplementation 拍卖合约地址
     */
    function initialize(address _logicImplementation) public initializer {
        __NFTAuctionFactory_init(_logicImplementation);
        version = 1;
    }

    function __NFTAuctionFactory_init(address _logicImplementation) internal onlyInitializing {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        _setLogicImplementation(_logicImplementation);
    }

    function setLogicImplementation(address _logicImplementation) external onlyOwner {
        _setLogicImplementation(_logicImplementation);
    }

    /**
     * @dev 设置拍卖合约地址
     * @param _logicImplementation 拍卖合约地址
     */
    function _setLogicImplementation(address _logicImplementation) internal {
        logicImplementation = _logicImplementation;
    }

    /**
     * @dev 创建拍卖
     * @param _nft NFT合约地址
     * @param _tokenId NFT tokenId
     * @param _startPrice 起拍价格
     * @param _duration 拍卖持续时间
     */
    function createAuction(
        address _nft,
        uint256 _tokenId,
        uint256 _startPrice,
        uint256 _duration
    ) public onlySeller nonReentrant {
        // 先将NFT发送到工厂合约
        IERC721(_nft).safeTransferFrom(msg.sender, address(this), _tokenId);
        // 使用 Proxy
        bytes memory _initData = abi.encodeWithSelector(
            NFTAuction.initialize.selector,
            owner(),
            msg.sender,
            _nft,
            _tokenId,
            _startPrice,
            _duration
        );
        // 创建代理合约
        address proxy = address(new ERC1967Proxy(logicImplementation, _initData));
        // 将NFT从工厂合约发送到代理合约
        IERC721(_nft).safeTransferFrom(address(this), proxy, _tokenId);
        // 将拍卖合约地址添加到卖家拍卖列表中
        auctionList[msg.sender].push(proxy);
        // 触发出价事件
        emit AuctionCreated(msg.sender, proxy);
    }

    /**
     * @dev 授权升级
     * @param newImplementation 新合约地址
     */
    function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner {
        if (address(newImplementation) == address(0)) {
            revert InvalidAddress(address(0));
        }
    }

    /**
     * @dev 接收ERC721代币, 接收拍卖的NFT
     * @return bytes4 返回值
     */
    function onERC721Received(address, address, uint256, bytes memory) public virtual returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
