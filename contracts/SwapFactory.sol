// SPDX-License-Identifier: Unlicense
pragma solidity =0.8.17;

import {SwapFactoryInternal} from "./libraries/SwapFactoryInternal.sol";
import {SwapPair} from "./SwapPair.sol";
import {ISwapPair} from "./interfaces/ISwapPair.sol";

contract SwapFactory is SwapFactoryInternal {
    /* 
    // STATE VARIABLES 
    */
    mapping(address => mapping(address => address)) public pairs;
    address[] public allPairs;

    /* 
    // FUNCTIONS
    */
    function createPair(
        address tokenA,
        address tokenB
    ) external returns (address pair) {
        if (tokenA == tokenB) revert SwapFactory__IdenticalAddresses();

        (address token0, address token1) = tokenA < tokenB
            ? (tokenA, tokenB)
            : (tokenB, tokenA);

        if (token0 == address(0)) revert SwapFactory__ZeroAddress();

        if (pairs[token0][token1] != address(0))
            revert SwapFactory__PairExists();

        bytes memory bytecode = type(SwapPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));

        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }

        ISwapPair(pair).initialize(token0, token1);

        pairs[token0][token1] = pair;
        pairs[token1][token0] = pair;
        allPairs.push(pair);

        emit PairCreated(token0, token1, pair, allPairs.length);
    }
}
