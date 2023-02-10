// SPDX-License-Identifier: Unlicense
pragma solidity =0.8.17;

import {SwapRouterInternal} from "./libraries/SwapRouterInternal.sol";
import {ISwapPair} from "./interfaces/ISwapPair.sol";

contract SwapRouter is SwapRouterInternal {
    /* 
    // STATE VARIABLES 
    */
    ISwapPair factory;

    constructor(address factoryAddress) {
        factory = ISwapPair(factoryAddress);
    }
}
