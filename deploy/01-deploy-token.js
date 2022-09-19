const { network, getNamedAccounts, deployments } = require("hardhat")
const { developmentChains, INITIAL_SUPPLY } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    //const chainId = network.config.chainId

    log(`Network: ${network.name}`)
    const tokenArgs = [INITIAL_SUPPLY]
    const token = await deploy("ExoticToken", {
        contract: "ExoticToken",
        from: deployer,
        args: tokenArgs, //
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(token.address, tokenArgs)
    }

    log("------------------------------------------")
}

module.exports.tags = ["all", "token"]
