const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains, INITIAL_SUPPLY } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts()
    const token = await ethers.getContract("ExoticToken")

    log(`Network: ${network.name}`)
    const dexArgs = [token.address]
    const dex = await deploy("DEX", {
        contract: "DEX",
        from: deployer,
        args: dexArgs, //
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(dex.address, dexArgs)
    }

    log("------------------------------------------")
}

module.exports.tags = ["all", "dex"]
