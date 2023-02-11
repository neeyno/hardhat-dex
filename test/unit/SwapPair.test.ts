import { expect, assert } from "chai"
import { ethers, deployments, network } from "hardhat"
import { developmentChains } from "../../helper-hardhat-config"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { TokenA, TokenB, SwapPair } from "../../typechain-types"
import { BigNumber } from "ethers"

const toWei = (value: number): BigNumber =>
    ethers.utils.parseEther(value.toString())
const fromWei = (value: BigNumber): string => ethers.utils.formatEther(value)

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
              //user = accounts[1]
          })

          beforeEach(async function () {
              await deployments.fixture("all")
              pair = await ethers.getContract("SwapPair")
              tokenA = await ethers.getContract("TokenA")
              tokenB = await ethers.getContract("TokenB")
          })

          describe("mint() - add liquidity", function () {
              beforeEach(async function () {
                  await tokenA.transfer(pair.address, toWei(1))
                  await tokenB.transfer(pair.address, toWei(1))
                  await pair.mint(deployer.address)
              })

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
                  await pair.mint(deployer.address)

                  const [reserveA, reserveB] = await pair.getReserves()

                  expect(await pair.balanceOf(deployer.address)).to.eq(
                      toWei(2).sub(1000)
                  )
                  expect(reserveA).to.equal(toWei(3))
                  expect(reserveB).to.equal(toWei(2))
              })
          })

          describe("burn() - remove liquidity", function () {
              beforeEach(async function () {
                  await tokenA.transfer(pair.address, toWei(1))
                  await tokenB.transfer(pair.address, toWei(1))
                  await pair.mint(deployer.address)
              })

              it("removes liquidity", async function () {
                  const liquidity = await pair.balanceOf(deployer.address)
                  await pair.transfer(pair.address, liquidity)

                  await pair.burn(deployer.address)

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
                  await pair.mint(deployer.address)

                  const liquidity = await pair.balanceOf(deployer.address)
                  await pair.transfer(pair.address, liquidity)

                  await pair.burn(deployer.address)

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

          describe("swap() - tokens swapping", function () {
              beforeEach(async function () {
                  await tokenA.transfer(pair.address, toWei(1))
                  await tokenB.transfer(pair.address, toWei(2))
                  await pair.mint(deployer.address)
              })

              it("swap basic scenario", async function () {
                  const amountOut = toWei(0.183322178776029826)

                  await tokenA.transfer(pair.address, toWei(0.1))
                  await pair.swap(0, amountOut, deployer.address, "0x")

                  const [reserveA, reserveB] = await pair.getReserves()

                  expect(await tokenA.balanceOf(deployer.address)).to.eq(
                      toWei(10).sub(toWei(1)).sub(toWei(0.1))
                  )
                  expect(await tokenB.balanceOf(deployer.address)).to.eq(
                      toWei(10).sub(toWei(2)).add(toWei(0.18))
                  )
                  expect(reserveA).to.equal(toWei(1).add(toWei(0.1)))
                  expect(reserveB).to.equal(toWei(2).sub(toWei(0.18)))
              })

              it("swap basic scenario reverse direction", async function () {
                  await tokenB.transfer(pair.address, toWei(0.2))
                  await pair.swap(toWei(0.09), 0, deployer.address, "0x")

                  const [reserveA, reserveB] = await pair.getReserves()

                  expect(await tokenA.balanceOf(deployer.address)).to.eq(
                      toWei(10).sub(toWei(1)).add(toWei(0.09))
                  )
                  expect(await tokenB.balanceOf(deployer.address)).to.eq(
                      toWei(10).sub(toWei(2)).sub(toWei(0.2))
                  )
                  expect(reserveA).to.equal(toWei(1).sub(toWei(0.09)))
                  expect(reserveB).to.equal(toWei(2).add(toWei(0.2)))
              })

              it("swap bidirectional", async function () {
                  await tokenA.transfer(pair.address, toWei(0.1))
                  await tokenB.transfer(pair.address, toWei(0.2))
                  await pair.swap(
                      toWei(0.09),
                      toWei(0.18),
                      deployer.address,
                      "0x"
                  )

                  const [reserveA, reserveB] = await pair.getReserves()

                  expect(await tokenA.balanceOf(deployer.address)).to.eq(
                      toWei(10).sub(toWei(1)).sub(toWei(0.01))
                  )
                  expect(await tokenB.balanceOf(deployer.address)).to.eq(
                      toWei(10).sub(toWei(2)).sub(toWei(0.02))
                  )
                  expect(reserveA).to.equal(toWei(1).add(toWei(0.01)))
                  expect(reserveB).to.equal(toWei(2).add(toWei(0.02)))
              })

              it("reverts with invalid K", async function () {
                  await tokenA.transfer(pair.address, toWei(0.1))

                  await expect(
                      pair.swap(
                          0,
                          toWei(0.181322178776029827),
                          deployer.address,
                          "0x"
                      )
                  ).to.be.revertedWithCustomError(pair, "SwapPair__InvalidK")
              })
          })
      })
