// SPDX-License-Identifier: Unlicense
pragma solidity =0.8.17;

import "hardhat/console.sol";

import {ERC20} from "@rari-capital/solmate/src/tokens/ERC20.sol";
import {IERC20} from "./interfaces/IERC20.sol";
import {Math} from "./libraries/Math.sol";
import {UQ112x112} from "./libraries/UQ112x112.sol";
import {SwapPairInternal} from "./libraries/SwapPairInternal.sol";

contract SwapPair is SwapPairInternal, ERC20 {
    using Math for uint256;
    using UQ112x112 for uint224;

    /* 
    // STATE VARIABLES 
    */
    uint256 private constant MINIMUM_LIQUIDITY = 1000;

    address public token0;
    address public token1;

    uint256 public price0CumulativeLast;
    uint256 public price1CumulativeLast;

    uint112 private reserve0;
    uint112 private reserve1;
    uint32 private blockTimestampLast;

    /* 
    // FUNCTIONS
    */
    constructor(
        address token0_,
        address token1_
    ) ERC20("SwapToken Pair", "SWT", 18) {
        token0 = token0_;
        token1 = token1_;
    }

    function initialize(address token0_, address token1_) external {
        if (token0 != address(0) || token1 != address(0))
            revert SwapPair__AlreadyInitialized();

        token0 = token0_;
        token1 = token1_;
    }

    function mint(address to) external returns (uint256 liquidity) {
        (uint112 _reserve0, uint112 _reserve1, ) = getReserves();
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));
        uint256 amount0 = balance0 - _reserve0;
        uint256 amount1 = balance1 - _reserve1;

        if (totalSupply == 0) {
            liquidity = (amount0 * amount1).sqrt() - MINIMUM_LIQUIDITY;
            _mint(address(0), MINIMUM_LIQUIDITY);
        } else {
            liquidity = ((amount0 * totalSupply) / _reserve0).min(
                (amount1 * totalSupply) / _reserve1
            );
        }

        if (liquidity <= 0) revert SwapPair__InsufficientLiquidityMinted();

        _mint(to, liquidity);

        _update(balance0, balance1, _reserve0, _reserve1);

        emit Mint(to, amount0, amount1);
    }

    function burn(
        address to
    ) external returns (uint256 amount0, uint256 amount1) {
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));
        uint256 liquidity = balanceOf[address(this)];

        console.log("liquidity ", liquidity);

        amount0 = (liquidity * balance0) / totalSupply;
        amount1 = (liquidity * balance1) / totalSupply;

        if (amount0 == 0 || amount1 == 0)
            revert SwapPair__InsufficientLiquidityBurned();

        _burn(address(this), liquidity);

        _safeTransfer(token0, to, amount0);
        _safeTransfer(token1, to, amount1);

        balance0 = IERC20(token0).balanceOf(address(this));
        balance1 = IERC20(token1).balanceOf(address(this));

        (uint112 reserve0_, uint112 reserve1_, ) = getReserves();
        _update(balance0, balance1, reserve0_, reserve1_);

        emit Burn(msg.sender, amount0, amount1, to);
    }

    function swap(
        uint256 amount0Out,
        uint256 amount1Out,
        address to,
        bytes calldata data
    ) external {
        if (amount0Out == 0 && amount1Out == 0)
            revert SwapPair__InsufficientOutputAmount();

        (uint112 reserve0_, uint112 reserve1_, ) = getReserves();

        if (amount0Out > reserve0_ || amount1Out > reserve1_)
            revert SwapPair__InsufficientLiquidity();

        if (amount0Out > 0) _safeTransfer(token0, to, amount0Out);
        if (amount1Out > 0) _safeTransfer(token1, to, amount1Out);

        uint256 balance0 = IERC20(token0).balanceOf(address(this)) - amount0Out;
        uint256 balance1 = IERC20(token1).balanceOf(address(this)) - amount1Out;

        uint256 amount0In = balance0 > reserve0 - amount0Out
            ? balance0 - (reserve0 - amount0Out)
            : 0;
        uint256 amount1In = balance1 > reserve1 - amount1Out
            ? balance1 - (reserve1 - amount1Out)
            : 0;

        if (amount0In == 0 && amount1In == 0)
            revert SwapPair__InsufficientInputAmount();

        // Adjusted = balance before swap - swap fee; fee stays in the contract
        uint256 balance0Adjusted = (balance0 * 1000) - (amount0In * 3);
        uint256 balance1Adjusted = (balance1 * 1000) - (amount1In * 3);

        console.log(balance0Adjusted * balance1Adjusted);
        console.log(uint256(reserve0_) * uint256(reserve1_) * (1000 ** 2));

        if (
            balance0Adjusted * balance1Adjusted <
            uint256(reserve0_) * uint256(reserve1_) * (1000 ** 2)
        ) revert SwapPair__InvalidK();

        _update(balance0, balance1, reserve0_, reserve1_);

        emit Swap(msg.sender, amount0Out, amount1Out, to);
    }

    function update() external {
        (uint112 reserve0_, uint112 reserve1_, ) = getReserves();
        _update(
            IERC20(token0).balanceOf(address(this)),
            IERC20(token1).balanceOf(address(this)),
            reserve0_,
            reserve1_
        );
    }

    function getReserves() public view returns (uint112, uint112, uint32) {
        return (reserve0, reserve1, blockTimestampLast);
    }

    //

    function _update(
        uint256 balance0,
        uint256 balance1,
        uint112 reserve0_,
        uint112 reserve1_
    ) private {
        if (balance0 > type(uint112).max || balance1 > type(uint112).max)
            revert SwapPair__BalanceOverflow();

        unchecked {
            uint32 timeElapsed = uint32(block.timestamp) - blockTimestampLast;

            if (timeElapsed > 0 && reserve0_ > 0 && reserve1_ > 0) {
                price0CumulativeLast +=
                    uint256(UQ112x112.encode(reserve1_).uqdiv(reserve0_)) *
                    timeElapsed;
                price1CumulativeLast +=
                    uint256(UQ112x112.encode(reserve0_).uqdiv(reserve1_)) *
                    timeElapsed;
            }
        }

        reserve0 = uint112(balance0);
        reserve1 = uint112(balance1);
        blockTimestampLast = uint32(block.timestamp);

        emit Update(reserve0, reserve1);
    }
}
