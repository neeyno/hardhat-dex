// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.17;

interface ISwapFactory {
    function pairs(address, address) external view returns (address);

    function createPair(address, address) external returns (address);
}
