// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/* ERRORS */
error DEX_nullValue();
error DEX_TokenTransferFailed();
error DEX_TransferFailed();
error DEX_NotEnoughLiquidity();
error DEX_alreadyInit();

/**@title A basic Decentralized Exchange smart contract.
 * @notice This contract is a swap with one token pair(ERC20 and Eth).
 * @dev This implements the Automated Market Maker (AMM) and Liquidity Pool.
 */
contract DEX is ReentrancyGuard {
    /* GLOBAL VARIABLES */
    IERC20 private immutable token;
    uint256 private totalLiquidity;
    mapping(address => uint256) private liquidity;

    /* EVENTS */
    event Swap(address indexed buyer, uint256 indexed input, uint256 indexed output, string asset);

    event Deposit(
        address indexed sender,
        uint256 indexed ethAmount,
        uint256 indexed tokenAmount,
        uint256 liquidityAmount
    );

    event Withdrawal(
        address indexed sender,
        uint256 indexed ethAmount,
        uint256 indexed tokenAmount,
        uint256 liquidityAmount
    );

    /* FUNCTIONS */
    /**
     * @notice The counstructor sets the token address.
     * @param tokenAddress: ERC-20 token address.
     * @dev The token address will connect to the IERC20 interface
     * which will be used with the "token" variable.
     */
    constructor(address tokenAddress) {
        token = IERC20(tokenAddress);
    }

    /**
     * @notice The function initializes Liquidity pool with provided asset amount.
     * @param tokenAmount: initial ERC-20 token amount.
     * param msg.value: initial Eth amount.
     */
    function init(uint256 tokenAmount) external payable {
        if (totalLiquidity != 0) {
            revert DEX_alreadyInit();
        }
        if (!token.transferFrom(msg.sender, address(this), tokenAmount)) {
            revert DEX_TokenTransferFailed();
        }
        uint256 initLiquidity = msg.value * tokenAmount;
        totalLiquidity = initLiquidity;
        liquidity[msg.sender] = initLiquidity;
    }

    /**
     * @notice This function allows the user to supply assets to the Liquidity pool.
     * param msg.value: provided Eth amount.
     * @notice Token amount is determined based on the provided eth amount.
     * Ensure you have enough token allowance.
     */
    function deposit() external payable {
        uint256 ethReserve = address(this).balance - msg.value;
        //uint256 tokenReserve = token.balanceOf(address(this));
        uint256 _totalLiquidity = totalLiquidity;
        uint256 newLiquidity = (msg.value * _totalLiquidity) / ethReserve;
        uint256 tokenAmount = (newLiquidity * token.balanceOf(address(this))) / _totalLiquidity;
        //bool transfered = token.transferFrom(msg.sender, address(this), tokenAmount);
        if (!token.transferFrom(msg.sender, address(this), tokenAmount)) {
            revert DEX_TokenTransferFailed();
        }
        _totalLiquidity += newLiquidity;
        liquidity[msg.sender] += newLiquidity;
        totalLiquidity = _totalLiquidity;
        emit Deposit(msg.sender, msg.value, tokenAmount, _totalLiquidity);
    }

    /**
     * @notice This function allows the user to remove supplied liquidity.
     * @param liquidityAmount: specify liquidity amount.
     */
    function withdraw(uint256 liquidityAmount) external nonReentrant returns (uint256, uint256) {
        if (liquidity[msg.sender] < liquidityAmount) {
            revert DEX_NotEnoughLiquidity();
        }
        //uint256 ethReserve = address(this).balance;
        //uint256 tokenReserve = token.balanceOf(address(this));
        uint256 _totalLiquidity = totalLiquidity;
        uint256 tokenAmount = (liquidityAmount * token.balanceOf(address(this))) / _totalLiquidity; //(ratio * totalLiquidity) / ethReserve;
        uint256 ethAmount = (liquidityAmount * address(this).balance) / _totalLiquidity;
        _totalLiquidity -= liquidityAmount;
        liquidity[msg.sender] -= liquidityAmount;
        totalLiquidity = _totalLiquidity;
        //bool transfered = token.transfer(msg.sender, tokenAmount);
        if (!token.transfer(msg.sender, tokenAmount)) {
            revert DEX_TokenTransferFailed();
        }
        (bool sent, ) = payable(msg.sender).call{value: ethAmount}("");
        if (!sent) {
            revert DEX_TransferFailed();
        }
        emit Withdrawal(msg.sender, ethAmount, tokenAmount, _totalLiquidity);
        return (ethAmount, tokenAmount);
    }

    /**
     * @notice Swap ETH token in exchange to ERC-20 tokens.
     * param msg.value: Eth amount to sell.
     */
    function ethToToken() external payable returns (uint256) {
        if (msg.value == 0) {
            revert DEX_nullValue();
        }
        uint256 tokenAmountOut = getAmountOut(
            msg.value,
            address(this).balance - msg.value,
            token.balanceOf(address(this))
        );
        //bool transfered = token.transfer(msg.sender, tokenAmountOut);
        if (!token.transfer(msg.sender, tokenAmountOut)) {
            revert DEX_TokenTransferFailed();
        }
        emit Swap(msg.sender, msg.value, tokenAmountOut, "ethToToken");
        return tokenAmountOut;
    }

    /**
     * @notice Swap ERC-20 tokens in exchange to ETH.
     * @param tokenAmount: ERC-20 tokens amount to exchange.
     */
    function tokenToEth(uint256 tokenAmount) external returns (uint256) {
        if (tokenAmount == 0) {
            revert DEX_nullValue();
        }
        uint256 ethAmountOut = getAmountOut(
            tokenAmount,
            token.balanceOf(address(this)), // - tokenAmount,
            address(this).balance
        );
        //bool transfered = token.transferFrom(msg.sender, address(this), tokenAmount);
        if (!token.transferFrom(msg.sender, address(this), tokenAmount)) {
            revert DEX_TokenTransferFailed();
        }
        (bool sent, ) = payable(msg.sender).call{value: ethAmountOut}("");
        if (!sent) {
            revert DEX_TransferFailed();
        }
        emit Swap(msg.sender, tokenAmount, ethAmountOut, "tokenToEth");
        return ethAmountOut;
    }

    /* View/Pure FUNCTIONS */
    /**
     * @notice This calculates the output amount with fee.
     *  x * y = k formula to determine the exchange rate between two assets.
     */
    function getAmountOut(
        uint256 xInput,
        uint256 xReserve,
        uint256 yReserve
    ) public pure returns (uint256) {
        // dy = y * dx / (x + dx)
        uint256 xInputWithFee = xInput * 998; // dx  // 0.2 % fee
        uint256 divisible = yReserve * xInputWithFee; // y * dx
        uint256 divisor = xReserve * 1000 + xInputWithFee; // (x + dx)
        return (divisible / divisor); // dy
    }

    function getContractBalances() external view returns (uint256, uint256) {
        return (address(this).balance, token.balanceOf(address(this)));
    }

    function getTotalLiquidity() external view returns (uint256) {
        return totalLiquidity;
    }

    function getAccountLiquidity(address account) external view returns (uint256) {
        return liquidity[account];
    }

    function getTokenAddress() external view returns (IERC20) {
        return token;
    }
}
