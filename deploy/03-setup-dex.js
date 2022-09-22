const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { INITIAL_TOKEN_LIQUIDITY, INITIAL_ETH_LIQUIDITY } = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts()
    //const [deployer] = await ethers.getSigners()
    const token = await ethers.getContract("ExoticToken", deployer)
    const dex = await ethers.getContract("DEX", deployer)

    const deployerBalance = await token.balanceOf(deployer)
    log(`Total tokens amount: ${ethers.utils.formatUnits(deployerBalance, 18)}`)

    log("approving tokens...")
    const approveTx = await token.approve(dex.address, INITIAL_TOKEN_LIQUIDITY)
    await approveTx.wait(1)
    log("Approved!")

    log("depositing initial liquidity...")
    const depositeTx = await dex.init(INITIAL_TOKEN_LIQUIDITY, {
        value: INITIAL_ETH_LIQUIDITY,
    })
    await depositeTx.wait(1)
    // const transferTx = await token.transfer(dex.address, INITIAL_SUPPLY)
    // await transferTx.wait(1)
    const dexTokenBalance = await token.balanceOf(dex.address)
    const dexEthBalance = await ethers.provider.getBalance(dex.address)
    const dexLiquidity = await dex.getTotalLiquidity()

    log(`Dex token balance: ${ethers.utils.formatUnits(dexTokenBalance, 18)} EXT`)
    log(`Dex Eth balance: ${ethers.utils.formatUnits(dexEthBalance, 18)} ETH`)
    log(`Dex total liquidity: ${ethers.utils.formatUnits(dexLiquidity, 36)}`)

    log("------------------------------------------")
}

module.exports.tags = ["all", "setup"]
