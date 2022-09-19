const { ethers, network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

async function main() {
    const [deployer, user] = await ethers.getSigners()
    const vendor = await ethers.getContract("Vendor")
    //const token = await ethers.getContract("TokenVendor")
    const ethAmount = ethers.utils.parseEther("0.1")
    const contractBalance = await ethers.provider.getBalance(vendor.address)

    console.log(`Withdrawing ${ethers.utils.formatUnits(contractBalance, 18)} ETH...`)
    const withdrawTx = await vendor.connect(user).withdraw()
    await withdrawTx.wait(1)
    console.log("------------------------------------------")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
