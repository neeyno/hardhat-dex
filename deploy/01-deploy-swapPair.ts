import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/dist/types"

import { getNamedAccounts, deployments, network, ethers } from "hardhat"

const deploySwapPair: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    // code here

    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const tokenA = await ethers.getContract("TokenA")
    const tokenB = await ethers.getContract("TokenB")

    const args = [tokenA.address, tokenB.address]

    const swapPair = await deploy("SwapPair", {
        contract: "SwapPair",
        from: deployer,
        log: true,
        args: args,
    })

    log(`----------------------------------------------------`)
}

export default deploySwapPair
deploySwapPair.tags = [`all`, `swap`, `main`]
