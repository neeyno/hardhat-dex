const { ethers } = require("hardhat")
require("dotenv").config()

const networkConfig = {
    4: {
        name: "rinkeby",
        // vrfCoordinatorV2Address: "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
        // entranceFee: ethers.utils.parseEther("0.01"),
        // gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", //30 gwei Key Hash
        // subscriptionId: process.env.CHAINLINK_SUBSCRIBTION_ID,
        // callbackGasLimit: "500000", // 500 000
        // interval: "300", //300 sec
    },
    31337: {
        name: "hardhat",
        // entranceFee: ethers.utils.parseEther("1"),
        // gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // mocks doesn't care what lane we use
        // callbackGasLimit: "500000",
        // interval: "30", //30 sec
    },
}

const developmentChains = ["hardhat", "localhost"]

const INITIAL_SUPPLY = "1000000000000000000000" // 1000 *10**18

module.exports = {
    networkConfig,
    developmentChains,
    INITIAL_SUPPLY,
}
