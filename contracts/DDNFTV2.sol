// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./DDNFT.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

contract DDNFTV2 is DDNFT, PausableUpgradeable {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @custom:oz-upgrades-validate-as-initializer
    function initializeV2() public reinitializer(2) {
        __DDNFT_init(name(), symbol(), owner());
        __Pausable_init();
        version = "2";
    }

    function pause() external virtual onlyOwner {
        _pause();
    }

    function unpause() external virtual onlyOwner {
        _unpause();
    }

    function safeMint(address to) public virtual override onlyOwner whenNotPaused returns (uint256) {
        return super.safeMint(to);
    }
}
