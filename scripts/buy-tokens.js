const { ethers, network } = require("hardhat")
//const { developmentChains } = require("../helper-hardhat-config")

async function buy() {
    const [, user] = await ethers.getSigners()
    //const chainId = network.config.chainId.toString()
    const dex = await ethers.getContract("DEX")
    const token = await ethers.getContract("ExoticToken")
    const ethAmount = ethers.utils.parseEther("10")

    console.log("buying tokens...")
    const buyTx = await dex.connect(user).ethToToken({ value: ethAmount })
    await buyTx.wait(1)

    const tokenBalance = await token.balanceOf(user.address)
    console.log(`User token balance: ${ethers.utils.formatUnits(tokenBalance, 18)} EXT`)
    console.log("------------------------------------------")
}

buy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
