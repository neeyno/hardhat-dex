const { assert, expect } = require("chai")
const { ethers, deployments, getNamedAccounts, network } = require("hardhat")
const {
    developmentChains,
    INITIAL_ETH_LIQUIDITY,
    INITIAL_TOKEN_LIQUIDITY,
} = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Decentralized Exchange unit test", async function () {
          let dex, token, deployer, accounts

          const ETH_VALUE = ethers.utils.parseEther("1")
          const TOKEN_VALUE = ethers.utils.parseEther("1000")

          beforeEach(async function () {
              //deployer = (await getNamedAccounts()).deployer
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["all"])
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
                      await token.approve(dex.address, TOKEN_VALUE)
                      await dex.deposit({ value: ETH_VALUE })
                  })

                  it("receives tokens", async function () {
                      const tokenBalanceAfter = await token.balanceOf(dex.address)
                      const expectedTokenBalance = TOKEN_VALUE.add(tokenBalanceBefore)

                      assert.equal(tokenBalanceAfter.toString(), expectedTokenBalance.toString())
                  })

                  it("receives eth", async function () {
                      const ethBalanceAfter = await ethers.provider.getBalance(dex.address)
                      const expectedEthBalance = INITIAL_ETH_LIQUIDITY.add(ETH_VALUE)

                      assert.equal(ethBalanceAfter.toString(), expectedEthBalance.toString())
                  })

                  it("adds deposited liquidity", async function () {
                      const expectedLiquidity = liquidityBefore.add(
                          ETH_VALUE.mul(liquidityBefore).div(ethBalanceBefore)
                      )
                      const liquidityAfter = await dex.getTotalLiquidity()

                      assert.equal(liquidityAfter.toString(), expectedLiquidity.toString())
                  })

                  it("tracks sender deposit", async function () {
                      const expectedLiquidity = liquidityBefore.add(
                          ETH_VALUE.mul(liquidityBefore).div(ethBalanceBefore)
                      )
                      const senderLiquidity = await dex.getAccountLiquidity(deployer.address)

                      assert.equal(senderLiquidity.toString(), expectedLiquidity.toString())
                  })

                  it("emits LiquidityUpdate event", async function () {
                      const liquidity = await dex.getTotalLiquidity()
                      const ethBalance = await ethers.provider.getBalance(dex.address)
                      const expectedLiquidity = liquidity.add(
                          ETH_VALUE.mul(liquidity).div(ethBalance)
                      )
                      await token.approve(dex.address, TOKEN_VALUE)

                      await expect(dex.deposit({ value: ETH_VALUE }))
                          .to.emit(dex, "LiquidityUpdate")
                          .withArgs(deployer.address, "deposit", expectedLiquidity)
                  })
              })

              describe("Withdraw", function () {
                  const depositedLiquidity = TOKEN_VALUE.mul(ETH_VALUE)

                  beforeEach(async function () {
                      await token.approve(dex.address, TOKEN_VALUE)
                      await dex.deposit({ value: ETH_VALUE })
                      tokenBalanceBefore = await token.balanceOf(dex.address)
                      liquidityBefore = await dex.getTotalLiquidity()
                      ethBalanceBefore = await ethers.provider.getBalance(dex.address)
                      await dex.withdraw(depositedLiquidity)
                  })

                  it("checks sender liquidity value", async function () {
                      const falseLiquidityValue = depositedLiquidity.mul(10)

                      await expect(dex.withdraw(falseLiquidityValue)).to.be.revertedWith(
                          "DEX_NotEnoughLiquidity()"
                      )
                  })

                  it("updates sender liquidity", async function () {
                      const senderLiquidity = await dex.getAccountLiquidity(deployer.address)
                      const expectedLiquidity = TOKEN_VALUE.mul(ETH_VALUE)

                      assert.equal(
                          senderLiquidity.toString(),
                          expectedLiquidity,
                          "equal to initial 1000"
                      )
                  })

                  it("updates total liquidity", async function () {
                      const liquidityAfter = await dex.getTotalLiquidity()
                      const expectedLiquidity = TOKEN_VALUE.mul(ETH_VALUE)

                      assert.equal(
                          liquidityAfter.toString(),
                          expectedLiquidity,
                          "equal to initial 1000"
                      )
                  })

                  it("should transfer token", async function () {
                      const expectedTokenBalance = tokenBalanceBefore.sub(TOKEN_VALUE)
                      const tokenBalanceAfter = await token.balanceOf(dex.address)

                      assert.equal(
                          tokenBalanceAfter.toString(),
                          expectedTokenBalance.toString(),
                          "equal 1000 tokens"
                      )
                  })

                  it("should transfer Eth", async function () {
                      const ethBalanceAfter = await ethers.provider.getBalance(dex.address)
                      const expectedEthBalance = ethBalanceBefore.sub(ETH_VALUE)

                      assert.equal(
                          ethBalanceAfter.toString(),
                          expectedEthBalance.toString(),
                          "equal 1 eth"
                      )
                  })

                  it("emits LiquidityUpdate event", async function () {
                      liquidityBefore = await dex.getTotalLiquidity()
                      const expectedLiquidity = liquidityBefore.sub(depositedLiquidity)
                      await expect(dex.withdraw(depositedLiquidity))
                          .to.emit(dex, "LiquidityUpdate")
                          .withArgs(deployer.address, "withdraw", expectedLiquidity)
                  })

                  it("returns value", async function () {})
              })
          })

          describe("Swap", function () {
              beforeEach(async function () {
                  await token.approve(dex.address, TOKEN_VALUE)
                  await dex.deposit({ value: ETH_VALUE })
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
