// SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.17;

abstract contract SwapFactoryInternal {
    /* 
    ERRORS 
    */
    error SwapFactory__IdenticalAddresses();
    error SwapFactory__PairExists();
    error SwapFactory__ZeroAddress();

    /* 
    EVENTS  
    */
    event PairCreated(
        address indexed token0,
        address indexed token1,
        address pair,
        uint256
    );
}
