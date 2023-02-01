import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/dist/types"

import { getNamedAccounts, deployments, network, ethers } from "hardhat"

const deployToken: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    // code here

    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const tokenA = await deploy("TokenA", {
        contract: "TokenA",
        from: deployer,
        log: true,
        args: [],
    })
    const tokenB = await deploy("TokenB", {
        contract: "TokenB",
        from: deployer,
        log: true,
        args: [],
    })

    log(`----------------------------------------------------`)
}

export default deployToken
deployToken.tags = [`all`, `token`]
