// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./DDNFT.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

contract DDNFTV2 is DDNFT, PausableUpgradeable {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initializeV2() public reinitializer(2) {
        __Pausable_init();
    }

    function pause() external virtual onlyOwner {
        _pause();
    }

    function unpause() external virtual onlyOwner {
        _unpause();
    }

    function safeMint(address to) public virtual override onlyOwner whenNotPaused {
        super.safeMint(to);
    }

    function version() public pure virtual override returns (string memory) {
        return "2";
    }
}
