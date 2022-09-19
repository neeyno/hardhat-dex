// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

//error DEX_alreadyHasLiquidity();
error DEX_nullValue();
error DEX_TokenTransferFailed();
error DEX_TransferFailed();
error DEX_NotEnoughLiquidity();

contract DEX {
    /* GLOBAL VARIABLES */
    IERC20 private immutable token;
    uint256 private totalLiquidity;
    mapping(address => uint256) private liquidity;

    /* EVENTS */

    /* FUNCTIONS */
    constructor(address tokenAddress) {
        token = IERC20(tokenAddress);
    }

    // function init(uint256 tokens) public payable returns (uint256) {
    //     if (totalLiquidity != 0) {
    //         revert DEX_alreadyHasLiquidity();
    //     }
    //     totalLiquidity = address(this).balance * token.balanceOf(address(this));
    //     liquidity[msg.sender] = totalLiquidity;
    //     if (!token.transferFrom(msg.sender, address(this), tokens)) {
    //         revert DEX_TokenTransferFailed();
    //     }
    //     return totalLiquidity;
    // }

    function ethToToken() public payable {
        if (msg.value == 0) {
            revert DEX_nullValue();
        }
        uint256 tokenAmountOut = getAmountOut(
            msg.value,
            address(this).balance - msg.value,
            token.balanceOf(address(this))
        );
        bool transfered = token.transfer(msg.sender, tokenAmountOut);
        if (!transfered) {
            revert DEX_TokenTransferFailed();
        }
    }

    function tokenToEth(uint256 tokenAmount) public {
        if (tokenAmount == 0) {
            revert DEX_nullValue();
        }
        bool transfered = token.transferFrom(msg.sender, address(this), tokenAmount);
        if (!transfered) {
            revert DEX_TokenTransferFailed();
        }
        uint256 amountOfEthOut = getAmountOut(
            tokenAmount,
            token.balanceOf(address(this)),
            address(this).balance
        );
        (bool sent, ) = payable(msg.sender).call{value: amountOfEthOut}("");
        if (!sent) {
            revert DEX_TransferFailed();
        }
        // .transferFrom(msg.sender, address(this), amountOfEth);
        // emit BuyTokens(msg.sender, msg.value, amountOfTokens);
    }

    function deposite(uint256 tokenAmount) public payable returns (uint256) {
        bool transfered = token.transferFrom(msg.sender, address(this), tokenAmount);
        if (!transfered) {
            revert DEX_TokenTransferFailed();
        }
        uint256 newLiquidity = msg.value * tokenAmount;
        totalLiquidity += newLiquidity;
        liquidity[msg.sender] += newLiquidity;
        return newLiquidity;
    }

    function withdraw(uint256 liquidityAmount) public returns (uint256, uint256) {
        if (liquidity[msg.sender] < liquidityAmount) {
            revert DEX_NotEnoughLiquidity();
        }
        //uint256 liquidityOut = liquidity[msg.sender];
        uint256 ethReserve = address(this).balance;
        uint256 tokenReserve = token.balanceOf(address(this));
        uint256 tokenAmount = (liquidityAmount / totalLiquidity) * ethReserve; //(ratio * totalLiquidity) / ethReserve;
        uint256 ethAmount = (liquidityAmount / totalLiquidity) * tokenReserve;
        liquidity[msg.sender] -= liquidityAmount;
        totalLiquidity -= liquidityAmount;
        bool transfered = token.transfer(msg.sender, tokenAmount);
        if (!transfered) {
            revert DEX_TokenTransferFailed();
        }
        (bool sent, ) = payable(msg.sender).call{value: ethAmount}("");
        if (!sent) {
            revert DEX_TransferFailed();
        }
        return (ethAmount, tokenAmount);
    }

    function getRatio() public view returns (uint256) {
        return token.balanceOf(address(this)) / address(this).balance;
    }

    function getAmountOut(
        uint256 xInput,
        uint256 xReserve,
        uint256 yReserve
    ) public pure returns (uint256) {
        // dy = y * dx / (x + dx)
        uint256 xInputWithFee = xInput * 998; // dx  // 0.2 % fee
        uint256 divisible = yReserve * xInputWithFee; // y * dx
        uint256 divider = xReserve * 1000 + xInputWithFee; // (x + dx)
        return (divisible / divider); // dy
    }

    function getTotalLiquidity() public view returns (uint256) {
        return totalLiquidity;
    }

    function getAccountLiquidity(address account) public view returns (uint256) {
        return liquidity[account];
    }
}
