const { ethers, network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

async function main() {
    const [deployer, acc1] = await ethers.getSigners()
    //const chainId = network.config.chainId.toString()
    const vendor = await ethers.getContract("Vendor")
    const token = await ethers.getContract("TokenVendor")

    const tokenAmount = "1"
    const ethAmount = ethers.utils.parseEther(tokenAmount)

    console.log("Approving...")
    const approveTx = await token.connect(acc1).approve(vendor.address, ethAmount)
    await approveTx.wait(1)

    console.log("Selling tokens...")
    const sellTx = await vendor.connect(acc1).sellTokens(ethAmount)
    await sellTx.wait(1)

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
