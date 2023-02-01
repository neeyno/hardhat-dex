// SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.10;

abstract contract SwapPairInternal {
    error SwapPair__InsufficientLiquidityMinted();
    error SwapPair__InsufficientLiquidityBurned();
    error SwapPair__TransferFailed();

    event Burn(address indexed sender, uint256 amount0, uint256 amount1);
    event Mint(address indexed sender, uint256 amount0, uint256 amount1);
    event Update(uint256 reserve0, uint256 reserve1);

    function _safeTransfer(address token, address to, uint256 value) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSignature("transfer(address,uint256)", to, value)
        );
        if (!success || (data.length != 0 && !abi.decode(data, (bool))))
            revert SwapPair__TransferFailed();
    }
}
