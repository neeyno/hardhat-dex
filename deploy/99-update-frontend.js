const { network, ethers } = require("hardhat")
const fs = require("fs")

const FRONTEND_ADDRESSES_FILE = "../mixes/nextjs-dex/lib/contractAddresses.json"
const FRONTEND_ABI_LOCATION = "../mixes/nextjs-dex/lib/"

async function updateContractAddresses() {
    const dex = await ethers.getContract("DEX")
    const token = await ethers.getContract("ExoticToken")
    const contractAddresses = JSON.parse(fs.readFileSync(FRONTEND_ADDRESSES_FILE, "utf8"))
    const chainId = network.config.chainId.toString()

    if (chainId in contractAddresses) {
        if (!contractAddresses[chainId]["DEX"].includes(dex.address)) {
            contractAddresses[chainId]["DEX"].push(dex.address)
        }
        if (!contractAddresses[chainId]["DEX"].includes(token.address)) {
            contractAddresses[chainId]["DEX"].push(token.address)
        }
    } else {
        contractAddresses[chainId] = {
            DEX: [dex.address, token.address],
        }
    }

    fs.writeFileSync(FRONTEND_ADDRESSES_FILE, JSON.stringify(contractAddresses))
}

async function updateAbi() {
    const dex = await ethers.getContract("DEX")
    fs.writeFileSync(
        `${FRONTEND_ABI_LOCATION}dexAbi.json`,
        dex.interface.format(ethers.utils.FormatTypes.json)
    )

    const token = await ethers.getContract("ExoticToken")
    fs.writeFileSync(
        `${FRONTEND_ABI_LOCATION}tokenAbi.json`,
        token.interface.format(ethers.utils.FormatTypes.json)
    )
}

module.exports = async function () {
    if (process.env.UPDATE_FRONTEND) {
        console.log("Updating frontend")
        await updateContractAddresses()
        await updateAbi()
        console.log("------------------------------------------")
    }
}

module.exports.tags = ["all", "frontend"]
