const { ethers } = require("hardhat")
require("dotenv").config()

const networkConfig = {
    4: {
        name: "rinkeby",
    },
    31337: {
        name: "hardhat",
    },
}

const developmentChains = ["hardhat", "localhost"]

const INITIAL_TOKEN_SUPPLY = ethers.utils.parseEther("10000") // "10000000000000000000000" // 10000 *10**18
const INITIAL_TOKEN_LIQUIDITY = ethers.utils.parseEther("1000")
const INITIAL_ETH_LIQUIDITY = ethers.utils.parseEther("1") //"1000000000000000000" // 1 *10**18

module.exports = {
    networkConfig,
    developmentChains,
    INITIAL_TOKEN_SUPPLY,
    INITIAL_TOKEN_LIQUIDITY,
    INITIAL_ETH_LIQUIDITY,
}
