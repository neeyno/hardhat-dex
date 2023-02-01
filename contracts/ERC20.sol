// SPDX-License-Identifier: Unlicense
pragma solidity =0.8.17;

import {ERC20} from "@rari-capital/solmate/src/tokens/ERC20.sol";

contract TokenA is ERC20 {
    constructor() ERC20("TokenA", "TKN-A", 18) {
        _mint(msg.sender, 10 * 1e18);
    }
}

contract TokenB is ERC20 {
    constructor() ERC20("TokenB", "TKN-B", 18) {
        _mint(msg.sender, 10 * 1e18);
    }
}
