// SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.17;

abstract contract SwapRouterInternal {
    error SwapRouter__InsufficientAAmount();
    error SwapRouter__InsufficientBAmount();
    error SwapRouter__SafeTransferFailed();
}
