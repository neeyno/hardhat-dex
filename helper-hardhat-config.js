const { ethers } = require("hardhat")
require("dotenv").config()

const networkConfig = {
    4: {
        name: "rinkeby",
        tokenSupply: "1000000000000000000000000", //1000000 * 10e18,
        initTokenLiquidity: "1000000000000000000000", // 1000 * 10e18,
        initEthLiquidity: "100000000000000000", //0.1 * 10e18,
    },
    5: {
        name: "goerli",
        tokenSupply: "1000000000000000000000000", //1000000 * 10e18,
        initTokenLiquidity: "1000000000000000000000", // 1000 * 10e18,
        initEthLiquidity: "100000000000000000", //0.1 * 10e18,
    },
    31337: {
        name: "hardhat",
        tokenSupply: ethers.utils.parseEther("1000000"), // 1000000 * 10e18,
        initTokenLiquidity: ethers.utils.parseEther("1000"), //1000 * 10e18,
        initEthLiquidity: ethers.utils.parseEther("1"), //1 * 10e18,
    },
}

const developmentChains = ["hardhat", "localhost"]

// const INITIAL_TOKEN_SUPPLY = ethers.utils.parseEther("10000") // "10000000000000000000000" // 10000 *10**18
// const INITIAL_TOKEN_LIQUIDITY = ethers.utils.parseEther("1000")
// const INITIAL_ETH_LIQUIDITY = ethers.utils.parseEther("1") //"1000000000000000000" // 1 *10**18

module.exports = {
    networkConfig,
    developmentChains,
}
