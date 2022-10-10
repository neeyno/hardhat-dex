const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { networkConfig } = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts()
    //const [deployer] = await ethers.getSigners()
    const token = await ethers.getContract("ExoticToken", deployer)
    const dex = await ethers.getContract("DEX", deployer)
    const chainId = network.config.chainId
    const initTokenLiquidity = networkConfig[chainId]["initTokenLiquidity"]
    const initEthLiquidity = networkConfig[chainId]["initEthLiquidity"]

    const deployerBalance = await token.balanceOf(deployer)
    log(`Total tokens amount: ${ethers.utils.formatUnits(deployerBalance, 18)}`)

    log("approving tokens...")
    const approveTx = await token.approve(dex.address, initTokenLiquidity)
    await approveTx.wait(1)
    log("Approved!")

    log("depositing initial liquidity...")
    const depositTx = await dex.init(initTokenLiquidity, {
        value: initEthLiquidity,
    })
    await depositTx.wait(1)

    const dexTokenBalance = await token.balanceOf(dex.address)
    const dexEthBalance = await ethers.provider.getBalance(dex.address)
    const dexLiquidity = await dex.getTotalLiquidity()

    log(`Dex token balance: ${ethers.utils.formatUnits(dexTokenBalance, 18)} EXT`)
    log(`Dex Eth balance: ${ethers.utils.formatUnits(dexEthBalance, 18)} ETH`)
    log(`Dex total liquidity: ${ethers.utils.formatUnits(dexLiquidity, 36)}`)

    log("------------------------------------------")
}

module.exports.tags = ["all", "setup", "test"]
