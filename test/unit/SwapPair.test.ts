import { expect, assert } from "chai"
import { ethers, deployments, network } from "hardhat"
import { developmentChains } from "../../helper-hardhat-config"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { TokenA, TokenB, SwapPair } from "../../typechain-types"
import { BigNumber } from "ethers"

const toWei = (value: number) => ethers.utils.parseEther(value.toString())
const fromWei = (value: BigNumber) => ethers.utils.formatEther(value)

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("SwapPair unit test", function () {
          let [deployer, user]: SignerWithAddress[] = []
          let pair: SwapPair
          let tokenA: TokenA
          let tokenB: TokenB

          before(async () => {
              const accounts = await ethers.getSigners()
              deployer = accounts[0]
              user = accounts[1]
          })

          beforeEach(async function () {
              await deployments.fixture("all")
              pair = await ethers.getContract("SwapPair")
              tokenA = await ethers.getContract("TokenA")
              tokenB = await ethers.getContract("TokenB")
          })

          beforeEach(async function () {
              await tokenA.transfer(pair.address, toWei(1))
              await tokenB.transfer(pair.address, toWei(1))
              await pair.mint()
          })

          describe("mint() - add liquidity", function () {
              it("provides initial liquidity", async function () {
                  const [reserveA, reserveB] = await pair.getReserves()

                  expect(await pair.balanceOf(deployer.address)).to.eq(
                      toWei(1).sub(1000)
                  )
                  expect(reserveA).to.equal(reserveB)
                  expect(await pair.totalSupply()).to.equal(toWei(1))
              })

              it("mints new liquidity", async function () {
                  // mint new liquidity when there are some liquidity
                  await tokenA.transfer(pair.address, toWei(2))
                  await tokenB.transfer(pair.address, toWei(1))
                  await pair.mint()

                  const [reserveA, reserveB] = await pair.getReserves()

                  expect(await pair.balanceOf(deployer.address)).to.eq(
                      toWei(2).sub(1000)
                  )
                  expect(reserveA).to.equal(toWei(3))
                  expect(reserveB).to.equal(toWei(2))
              })
          })

          describe("burn() - remove liquidity", function () {
              it("removes liquidity", async function () {
                  await pair.burn()

                  const [reserveA, reserveB] = await pair.getReserves()

                  // 10 tokens - is initial deployer balance
                  expect(await tokenA.balanceOf(deployer.address)).to.eq(
                      toWei(10).sub(1000)
                  )
                  expect(await tokenB.balanceOf(deployer.address)).to.eq(
                      toWei(10).sub(1000)
                  )
                  expect(await pair.balanceOf(deployer.address)).to.eq(0)
                  expect(await pair.totalSupply()).to.equal(1000) // MINIMUM_LIQUIDITY
                  expect(reserveA).to.equal(1000)
                  expect(reserveB).to.equal(1000)
              })

              it("removes liquidity with unbalanced reserves", async function () {
                  await tokenA.transfer(pair.address, toWei(2))
                  await tokenB.transfer(pair.address, toWei(1))
                  await pair.mint()

                  await pair.burn()

                  const [reserveA, reserveB] = await pair.getReserves()

                  // 10 tokens - is initial deployer balance
                  expect(await tokenA.balanceOf(deployer.address)).to.eq(
                      toWei(10).sub(1500)
                  )
                  expect(await tokenB.balanceOf(deployer.address)).to.eq(
                      toWei(10).sub(1000)
                  )
                  expect(await pair.balanceOf(deployer.address)).to.eq(0)
                  expect(await pair.totalSupply()).to.equal(1000) // MINIMUM_LIQUIDITY
                  expect(reserveA).to.equal(1500)
                  expect(reserveB).to.equal(1000)
              })
          })
      })
