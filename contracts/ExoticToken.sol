// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ExoticToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("Exotic Token", "EXT") {
        _mint(msg.sender, initialSupply); // mints tokens!
    }
}
