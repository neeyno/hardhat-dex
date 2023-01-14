// SPDX-License-Identifier: MIT

// contracts/IExchange.sol
pragma solidity 0.8.17;

interface IExchange {
    function addLiquidity(
        uint256 _tokenAmount
    ) external payable returns (uint256);

    function removeLiquidity(
        uint256 _amount
    ) external returns (uint256, uint256);

    function ethToTokenSwap(uint256 _minTokens) external payable;

    function ethToTokenTransfer(
        uint256 _minTokens,
        address _recipient
    ) external payable;

    function tokenToEthSwap(uint256 _tokensSold, uint256 _minEth) external;
}
