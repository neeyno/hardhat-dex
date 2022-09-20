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

const INITIAL_SUPPLY = "1000000000000000000000" // 1000 *10**18

module.exports = {
    networkConfig,
    developmentChains,
    INITIAL_SUPPLY,
}
