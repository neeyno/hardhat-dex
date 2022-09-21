const { ethers, network } = require("hardhat")

//const

async function withdraw(liquidityAmount) {
    const [deployer, user] = await ethers.getSigners()
    const dex = await ethers.getContract("DEX")
    const token = await ethers.getContract("ExoticToken")
    const liquidityValue = ethers.utils.parseUnits(liquidityAmount, 36)

    console.log(`withdrawing liquidity...`)
    const withdrawTx = await dex.connect(user).withdraw(liquidityValue)
    await withdrawTx.wait(1)

    console.log(`Withdrawn liquidity: ${ethers.utils.formatUnits(withdrawTx, 36)}`)
}

withdraw(100)
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
