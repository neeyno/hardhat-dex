const { ethers, network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

async function main() {
    const [deployer, acc1] = await ethers.getSigners()
    //const chainId = network.config.chainId.toString()
    const vendor = await ethers.getContract("Vendor")
    const token = await ethers.getContract("TokenVendor")
    const ethAmount = ethers.utils.parseEther("0.1")

    const buyTx = await vendor.connect(acc1).buyTokens({ value: ethAmount })
    await buyTx.wait(1)

    const tokenBalance = await token.balanceOf(acc1.address)
    console.log(ethers.utils.formatUnits(tokenBalance, 18) + " tokens")
    console.log("------------------------------------------")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
