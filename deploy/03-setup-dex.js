const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains, INITIAL_SUPPLY } = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts }) => {
    const { deployer } = await getNamedAccounts()
    //const [deployer] = await ethers.getSigners()
    const token = await ethers.getContract("ExoticToken", deployer)
    const dex = await ethers.getContract("DEX", deployer)

    const deployerBalance = await token.balanceOf(deployer)
    console.log(`Total tokens amount: ${ethers.utils.formatUnits(deployerBalance, 18)}`)

    console.log("approving tokens...")
    const approveTx = await token.approve(dex.address, INITIAL_SUPPLY)
    await approveTx.wait(1)
    console.log("Approved!")

    console.log("depositing initial liquidity...")
    const initTokenAmount = INITIAL_SUPPLY //(INITIAL_SUPPLY / 2).toString()
    const initEthAmount = ethers.utils.parseEther("1")
    const depositeTx = await dex.deposite(initTokenAmount, {
        value: initEthAmount,
    })
    await depositeTx.wait(1)
    // const transferTx = await token.transfer(dex.address, INITIAL_SUPPLY)
    // await transferTx.wait(1)
    const dexTokenBalance = await token.balanceOf(dex.address)
    const dexEthBalance = await ethers.provider.getBalance(dex.address)
    const dexLiquidity = await dex.getTotalLiquidity()

    console.log(`Dex token balance: ${ethers.utils.formatUnits(dexTokenBalance, 18)} EXT`)
    console.log(`Dex Eth balance: ${ethers.utils.formatUnits(dexEthBalance, 18)} ETH`)
    console.log(`Dex total liquidity: ${ethers.utils.formatUnits(dexLiquidity, 36)}`)

    console.log("------------------------------------------")
}

module.exports.tags = ["all", "setup"]
