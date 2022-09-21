const { assert, expect } = require("chai")
const { ethers, deployments, getNamedAccounts, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Decentralized Exchange unit test", async function () {
          let dex, token, deployer, accounts

          const ethValue = ethers.utils.parseEther("1")
          const tokenValue = ethers.utils.parseEther("500")

          beforeEach(async function () {
              //deployer = (await getNamedAccounts()).deployer
              accounts = await ethers.getSigners()
              deployer = accounts[0]
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
                      await token.approve(dex.address, tokenValue)
                      await dex.deposite(tokenValue, { value: ethValue })
                  })

                  it("receives tokens", async function () {
                      const tokenBalanceAfter = await token.balanceOf(dex.address)
                      assert.equal(tokenBalanceBefore.toString(), "0")
                      assert.equal(tokenBalanceAfter.toString(), tokenValue.toString())
                  })

                  it("receives eth", async function () {
                      const ethBalanceAfter = await ethers.provider.getBalance(dex.address)
                      assert.equal(ethBalanceBefore.toString(), "0")
                      assert.equal(ethBalanceAfter.toString(), ethValue.toString())
                  })

                  it("updates total liquidity", async function () {
                      const expectedLiquidity = tokenValue.mul(ethValue)
                      const liquidityAfter = await dex.getTotalLiquidity()
                      assert.equal(liquidityBefore.toString(), "0")
                      assert.equal(liquidityAfter.toString(), expectedLiquidity.toString())
                  })

                  it("tracks sender liquidity", async function () {
                      const expectedLiquidity = tokenValue.mul(ethValue)
                      const senderLiquidity = await dex.getAccountLiquidity(deployer.address)
                      assert.equal(senderLiquidity.toString(), expectedLiquidity.toString())
                  })
                  it("emits event", async function () {})
                  it("returns value", async function () {})
              })

              describe("Withdraw", function () {
                  const depositedLiquidity = tokenValue.mul(ethValue)

                  beforeEach(async function () {
                      await token.approve(dex.address, tokenValue)
                      await dex.deposite(tokenValue, { value: ethValue })
                      tokenBalanceBefore = await token.balanceOf(dex.address)
                      liquidityBefore = await dex.getTotalLiquidity()
                      ethBalanceBefore = await ethers.provider.getBalance(dex.address)
                      await dex.withdraw(depositedLiquidity)
                  })

                  it("checks requested liquidity value", async function () {
                      const falseLiquidityValue = tokenValue.mul(ethers.utils.parseEther("2"))
                      await expect(dex.withdraw(falseLiquidityValue)).to.be.revertedWith(
                          "DEX_NotEnoughLiquidity()"
                      )
                  })

                  it("updates sender liquidity", async function () {
                      //await dex.withdraw(depositedLiquidity)
                      const senderLiquidity = await dex.getAccountLiquidity(deployer.address)
                      assert.equal(senderLiquidity.toString(), "0")
                  })

                  it("updates total liquidity", async function () {
                      const liquidityAfter = await dex.getTotalLiquidity()

                      assert.equal(liquidityBefore.toString(), depositedLiquidity.toString())
                      assert.equal(liquidityAfter.toString(), "0")
                  })

                  it("should transfer token", async function () {
                      const tokenBalanceAfter = await token.balanceOf(dex.address)
                      assert.equal(tokenBalanceBefore.toString(), tokenValue.toString())
                      assert.equal(tokenBalanceAfter.toString(), "0")
                  })

                  it("should transfer Eth", async function () {
                      ethBalanceAfter = await ethers.provider.getBalance(dex.address)
                      assert.equal(ethBalanceBefore.toString(), ethValue.toString())
                      assert.equal(ethBalanceAfter.toString(), "0")
                  })

                  it("emits event", async function () {})
                  it("returns value", async function () {})
              })
          })

          describe("Swap", function () {
              beforeEach(async function () {
                  await token.approve(dex.address, tokenValue + tokenValue)
                  await dex.deposite(tokenValue, { value: ethValue })
              })

              describe("Eth to Token", function () {
                  it("checks null eth value", async function () {
                      await expect(dex.ethToToken()).to.be.revertedWith("DEX_nullValue()")
                  })

                  // not supported by Hardhat
                  //   it("calls transfer tokens to buyer", async function () {
                  //       const testEthValue = ethers.utils.parseEther("0.1")
                  //       const expectedTokenValue = await dex.getAmountOut(
                  //           testEthValue,
                  //           await ethers.provider.getBalance(dex.address),
                  //           await token.balanceOf(dex.address)
                  //       )
                  //       await dex.ethToToken({ value: testEthValue })
                  //       expect("transfer").to.be.calledOnContractWith(token, [
                  //           deployer,
                  //           expectedTokenValue,
                  //       ])
                  //   })

                  it("transfers tokens to buyer", async function () {
                      const ethValueToSell = ethers.utils.parseEther("0.1")
                      const expectedTokenValue = await dex.getAmountOut(
                          ethValueToSell,
                          await ethers.provider.getBalance(dex.address),
                          await token.balanceOf(dex.address)
                      )

                      await expect(() =>
                          dex.ethToToken({ value: ethValueToSell })
                      ).to.changeTokenBalance(token, deployer, expectedTokenValue)
                  })

                  it("value", async function () {})
              })

              describe("Token to Eth", function () {
                  it("checks null token value", async function () {
                      await expect(dex.tokenToEth(0)).to.be.revertedWith("DEX_nullValue()")
                  })

                  it("transfers eth to buyer", async function () {
                      const tokenValueToSell = ethers.utils.parseEther("100")
                      const expectedEthValue = await dex.getAmountOut(
                          tokenValueToSell,
                          await token.balanceOf(dex.address),
                          await ethers.provider.getBalance(dex.address)
                      )

                      await expect(await dex.tokenToEth(tokenValueToSell)).to.changeEtherBalance(
                          deployer,
                          expectedEthValue
                      )
                  })
              })
          })
      })
