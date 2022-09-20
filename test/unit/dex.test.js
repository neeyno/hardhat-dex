const { assert, expect } = require("chai")
const { ethers, deployments, getNamedAccounts, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Decentralized Exchange", async function () {
          let dex, token, deployer, accounts, user

          const value1Eth = ethers.utils.parseEther("1")
          const value1000tokens = ethers.utils.parseEther("1000")

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              accounts = await ethers.getSigners()
              user = accounts[1]
              await deployments.fixture(["token", "dex"])
              dex = await ethers.getContract("DEX", deployer)
              token = await ethers.getContract("ExoticToken", deployer)
          })

          describe("Contructor", function () {
              it("should set the token address", async function () {
                  const actualTokenAddress = await dex.getTokenAddress()
                  assert.equal(actualTokenAddress, token.address)
              })
          })

          describe("Liquidity", function () {
              let liquidityBefore, tokenBalanceBefore, ethBalanceBefore
              describe("Deposit", function () {
                  beforeEach(async function () {
                      tokenBalanceBefore = await token.balanceOf(dex.address)
                      liquidityBefore = await dex.getTotalLiquidity()
                      ethBalanceBefore = await ethers.provider.getBalance(dex.address)
                      await token.approve(dex.address, value1000tokens)
                      await dex.deposite(value1000tokens, { value: value1Eth })
                  })

                  it("receives tokens", async function () {
                      const tokenBalanceAfter = await token.balanceOf(dex.address)
                      assert.equal(tokenBalanceBefore.toString(), "0")
                      assert.equal(tokenBalanceAfter.toString(), value1000tokens.toString())
                  })

                  it("receives eth", async function () {
                      const ethBalanceAfter = await ethers.provider.getBalance(dex.address)
                      assert.equal(ethBalanceBefore.toString(), "0")
                      assert.equal(ethBalanceAfter.toString(), value1Eth.toString())
                  })

                  it("adds up new liquidity value", async function () {
                      const expectedLiquidity = value1000tokens.mul(value1Eth)
                      const liquidityAfter = await dex.getTotalLiquidity()
                      assert.equal(liquidityBefore.toString(), "0")
                      assert.equal(liquidityAfter.toString(), expectedLiquidity.toString())
                  })

                  it("tracks sender liquidity", async function () {
                      const expectedLiquidity = value1000tokens.mul(value1Eth)
                      const senderLiquidity = await dex.getAccountLiquidity(deployer)
                      assert.equal(senderLiquidity.toString(), expectedLiquidity.toString())
                  })
                  it("emits event", async function () {})
                  it("returns value", async function () {})
              })

              describe("Withdraw", function () {
                  const depositedLiquidity = value1000tokens.mul(value1Eth)

                  beforeEach(async function () {
                      await token.approve(dex.address, value1000tokens)
                      await dex.deposite(value1000tokens, { value: value1Eth })
                      tokenBalanceBefore = await token.balanceOf(dex.address)
                      liquidityBefore = await dex.getTotalLiquidity()
                      ethBalanceBefore = await ethers.provider.getBalance(dex.address)
                      await dex.withdraw(depositedLiquidity)
                  })

                  it("checks requested liquidity value", async function () {
                      const falseLiquidityValue = value1000tokens.mul(ethers.utils.parseEther("2"))
                      await expect(dex.withdraw(falseLiquidityValue)).to.be.revertedWith(
                          "DEX_NotEnoughLiquidity()"
                      )
                  })

                  it("updates sender liquidity", async function () {
                      //await dex.withdraw(depositedLiquidity)
                      const senderLiquidity = await dex.getAccountLiquidity(deployer)
                      assert.equal(senderLiquidity.toString(), "0")
                  })

                  it("updates total liquidity", async function () {
                      const liquidityAfter = await dex.getTotalLiquidity()

                      assert.equal(liquidityBefore.toString(), depositedLiquidity.toString())
                      assert.equal(liquidityAfter.toString(), "0")
                  })

                  it("should transfer token", async function () {
                      const tokenBalanceAfter = await token.balanceOf(dex.address)
                      assert.equal(tokenBalanceBefore.toString(), value1000tokens.toString())
                      assert.equal(tokenBalanceAfter.toString(), "0")
                  })

                  it("should transfer Eth", async function () {
                      ethBalanceAfter = await ethers.provider.getBalance(dex.address)
                      assert.equal(ethBalanceBefore.toString(), value1Eth.toString())
                      assert.equal(ethBalanceAfter.toString(), "0")
                  })

                  it("emits event", async function () {})
                  it("returns value", async function () {})
              })
          })

          describe("Swap", function () {
              describe("Eth to Token", function () {})

              describe("Token to Eth", function () {})
          })
      })
