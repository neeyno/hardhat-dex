const { ethers, network } = require("hardhat")

async function deposit(tokensAmount, ethAmount) {
    const [deployer, user] = await ethers.getSigners()
    const dex = await ethers.getContract("DEX")
    const token = await ethers.getContract("ExoticToken")
    const tokenValue = ethers.utils.parseEther(tokensAmount.toString())
    const ethValue = ethers.utils.parseEther(ethAmount.toString())

    const transferTokenTx = await token.connect(deployer).transfer(user.address, tokenValue)
    await transferTokenTx.wait(1)

    const depositTx = await dex.connect(user).deposit(tokenValue, { value: ethValue })
    await depositTx.wait(1)

    const depositedLiquidity = await dex.getAccountLiquidity(user.address)
    console.log(`Deposited liquidity: ${ethers.utils.formatUnits(depositedLiquidity, 36)}`)
}

deposit(100, 1)
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
