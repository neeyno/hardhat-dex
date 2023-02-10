// SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.17;

abstract contract SwapPairInternal {
    /* 
    ERRORS 
    */
    error SwapPair__InsufficientLiquidityMinted();
    error SwapPair__InsufficientLiquidityBurned();
    error SwapPair__TransferFailed();
    error SwapPair__InsufficientOutputAmount();
    error SwapPair__InsufficientLiquidity();
    error SwapPair__InvalidK();
    error SwapPair__BalanceOverflow();
    error SwapPair__AlreadyInitialized();

    /* 
    EVENTS  
    */
    event Burn(address indexed sender, uint256 amount0, uint256 amount1);
    event Mint(address indexed sender, uint256 amount0, uint256 amount1);
    event Update(uint256 reserve0, uint256 reserve1);
    event Swap(
        address indexed sender,
        uint256 amount0Out,
        uint256 amount1Out,
        address indexed to
    );

    function _safeTransfer(address token, address to, uint256 value) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSignature("transfer(address,uint256)", to, value)
        );
        if (!success || (data.length != 0 && !abi.decode(data, (bool))))
            revert SwapPair__TransferFailed();
    }
}
