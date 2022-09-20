const { ethers, network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

async function sell() {
    const [, user] = await ethers.getSigners()
    //const chainId = network.config.chainId.toString()
    const dex = await ethers.getContract("DEX")
    const token = await ethers.getContract("ExoticToken")
    const userTokenBefore = await token.balanceOf(user.address)

    console.log("approving...")
    const approveTx = await token.connect(user).approve(dex.address, userTokenBefore)
    await approveTx.wait(1)

    console.log("selling tokens...")
    const sellTx = await dex.connect(user).tokenToEth(userTokenBefore)
    await sellTx.wait(1)

    const userTokenAfter = await token.balanceOf(user.address)
    console.log(`User token balance: ${ethers.utils.formatUnits(userTokenAfter, 18)} EXT`)
    console.log("------------------------------------------")
}

sell()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
