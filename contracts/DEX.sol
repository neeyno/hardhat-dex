// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

error DEX_nullValue();
error DEX_TokenTransferFailed();
error DEX_TransferFailed();
error DEX_NotEnoughLiquidity();
error DEX_alreadyHasLiquidity();

contract DEX {
    /* GLOBAL VARIABLES */
    IERC20 private immutable token;
    uint256 private totalLiquidity;
    mapping(address => uint256) private liquidity;

    /* EVENTS */
    event AssetSwap(
        address indexed buyer,
        uint256 indexed input,
        uint256 indexed output,
        string asset
    );

    event LiquidityUpdate(
        address indexed sender,
        string indexed call,
        uint256 indexed liquidityPool
    );

    /* FUNCTIONS */
    constructor(address tokenAddress) {
        token = IERC20(tokenAddress);
    }

    function init(uint256 tokenAmount) public payable returns (uint256) {
        if (totalLiquidity != 0) {
            revert DEX_alreadyHasLiquidity();
        }
        totalLiquidity = msg.value * tokenAmount;
        liquidity[msg.sender] = totalLiquidity;
        if (!token.transferFrom(msg.sender, address(this), tokenAmount)) {
            revert DEX_TokenTransferFailed();
        }
        return totalLiquidity;
    }

    function deposit() public payable {
        uint256 ethReserve = address(this).balance - msg.value;
        uint256 tokenReserve = token.balanceOf(address(this));
        uint256 newLiquidity = (msg.value * totalLiquidity) / ethReserve;
        uint256 tokenAmount = (newLiquidity * tokenReserve) / totalLiquidity;
        bool transfered = token.transferFrom(msg.sender, address(this), tokenAmount);
        if (!transfered) {
            revert DEX_TokenTransferFailed();
        }
        totalLiquidity += newLiquidity;
        liquidity[msg.sender] += newLiquidity;
        emit LiquidityUpdate(msg.sender, "deposit", totalLiquidity);
    }

    function withdraw(uint256 liquidityAmount) public returns (uint256, uint256) {
        if (liquidity[msg.sender] < liquidityAmount) {
            revert DEX_NotEnoughLiquidity();
        }
        //uint256 liquidityOut = liquidity[msg.sender];
        uint256 ethReserve = address(this).balance;
        uint256 tokenReserve = token.balanceOf(address(this));
        uint256 tokenAmount = (liquidityAmount * tokenReserve) / totalLiquidity; //(ratio * totalLiquidity) / ethReserve;
        uint256 ethAmount = (liquidityAmount * ethReserve) / totalLiquidity;
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
        emit LiquidityUpdate(msg.sender, "withdraw", totalLiquidity);
        return (ethAmount, tokenAmount);
    }

    function ethToToken() public payable returns (uint256) {
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
        emit AssetSwap(msg.sender, msg.value, tokenAmountOut, "ethToToken");
        return tokenAmountOut;
    }

    function tokenToEth(uint256 tokenAmount) public returns (uint256) {
        if (tokenAmount == 0) {
            revert DEX_nullValue();
        }
        bool transfered = token.transferFrom(msg.sender, address(this), tokenAmount);
        if (!transfered) {
            revert DEX_TokenTransferFailed();
        }
        uint256 ethAmountOut = getAmountOut(
            tokenAmount,
            token.balanceOf(address(this)) - tokenAmount,
            address(this).balance
        );
        (bool sent, ) = payable(msg.sender).call{value: ethAmountOut}("");
        if (!sent) {
            revert DEX_TransferFailed();
        }
        emit AssetSwap(msg.sender, tokenAmount, ethAmountOut, "tokenToEth");
        return ethAmountOut;
    }

    /* View/Pure FUNCTIONS */
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

    function getTokenAddress() public view returns (IERC20) {
        return token;
    }
}
