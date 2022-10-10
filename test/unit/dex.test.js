const { assert, expect } = require("chai")
const { ethers, deployments, getNamedAccounts, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

const chainId = network.config.chainId
const INITIAL_ETH_LIQUIDITY = networkConfig[chainId]["initEthLiquidity"]
const INITIAL_TOKEN_LIQUIDITY = networkConfig[chainId]["initTokenLiquidity"]

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
              await deployments.fixture(["test"])
              dex = await ethers.getContract("DEX", deployer)
              token = await ethers.getContract("ExoticToken", deployer)
          })

          describe("Contructor", function () {
              it("should set the token address", async function () {
                  const actualTokenAddress = await dex.getTokenAddress()

                  assert.equal(actualTokenAddress, token.address)
              })
          })

          describe("Initialization", function () {
              const initialLiquidity = INITIAL_ETH_LIQUIDITY.mul(INITIAL_TOKEN_LIQUIDITY)

              //   beforeEach(async function () {
              //       await deployments.fixture(["token", "dex"])
              //       dex = await ethers.getContract("DEX", deployer)
              //       token = await ethers.getContract("ExoticToken", deployer)
              //   })

              it("should init only once", async function () {
                  //   await dex.init(INITIAL_TOKEN_LIQUIDITY, {
                  //       value: INITIAL_ETH_LIQUIDITY,
                  //   })

                  await expect(dex.init(0, { value: 0 })).to.be.revertedWith("DEX_alreadyInit()")
              })

              it("sets initial liquidity", async function () {
                  const actualTotalLiquidity = await dex.getTotalLiquidity()

                  assert.equal(actualTotalLiquidity.toString(), initialLiquidity.toString())
              })

              it("updates sender liquidity balance", async function () {
                  const senderLiquidity = await dex.getAccountLiquidity(deployer.address)

                  assert.equal(senderLiquidity.toString(), initialLiquidity.toString())
              })

              it("receives initial token supply", async function () {
                  const expectedTokenBalance = INITIAL_TOKEN_LIQUIDITY
                  const dexTokenBalance = await token.balanceOf(dex.address)

                  assert.equal(dexTokenBalance.toString(), expectedTokenBalance.toString())
              })
              it("receives initial Eth supply", async function () {
                  const expectedEthBalance = INITIAL_ETH_LIQUIDITY
                  const dexEthBalance = await ethers.provider.getBalance(dex.address)

                  assert.equal(dexEthBalance.toString(), expectedEthBalance.toString())
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

                  it("updates total liquidity", async function () {
                      const expectedLiquidity = liquidityBefore.add(
                          ETH_VALUE.mul(liquidityBefore).div(ethBalanceBefore)
                      )
                      const liquidityAfter = await dex.getTotalLiquidity()

                      assert.equal(liquidityAfter.toString(), expectedLiquidity.toString())
                  })

                  it("updates sender deposit", async function () {
                      const expectedLiquidity = liquidityBefore.add(
                          ETH_VALUE.mul(liquidityBefore).div(ethBalanceBefore)
                      )
                      const senderLiquidity = await dex.getAccountLiquidity(deployer.address)

                      assert.equal(senderLiquidity.toString(), expectedLiquidity.toString())
                  })

                  it("emits Deposit event", async function () {
                      const liquidity = await dex.getTotalLiquidity()
                      const ethBalance = await ethers.provider.getBalance(dex.address)
                      const tokenBalance = await token.balanceOf(dex.address)
                      const newLiquidity = ETH_VALUE.mul(liquidity).div(ethBalance)
                      const expectedLiquidity = liquidity.add(newLiquidity)
                      const expectedTokenDeposit = newLiquidity.mul(tokenBalance).div(liquidity)
                      await token.approve(dex.address, TOKEN_VALUE)

                      await expect(dex.deposit({ value: ETH_VALUE }))
                          .to.emit(dex, "Deposit")
                          .withArgs(
                              deployer.address,
                              ETH_VALUE,
                              expectedTokenDeposit,
                              expectedLiquidity
                          )
                  })

                  //   it("returns ", async function () {
                  //       const [ethAmount, tokenAmount] = await dex.callStatic.withdraw(
                  //           depositedLiquidity
                  //       )
                  //   })
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

                  it("emits Withdrawal event", async function () {
                      liquidityBefore = await dex.getTotalLiquidity()
                      const expectedLiquidity = liquidityBefore.sub(depositedLiquidity)
                      const [ethAmount, tokenAmount] = await dex.callStatic.withdraw(
                          depositedLiquidity
                      )

                      await expect(dex.withdraw(depositedLiquidity))
                          .to.emit(dex, "Withdrawal")
                          .withArgs(deployer.address, ethAmount, tokenAmount, expectedLiquidity)
                  })

                  it("returns eth and token value", async function () {
                      const liquidity = await dex.getTotalLiquidity()
                      //const ethBalance = await ethers.provider.getBalance(dex.address)
                      const tokenBalance = await token.balanceOf(dex.address)
                      //const newLiquidity = ETH_VALUE.mul(liquidity).div(ethBalance)
                      const expectedTokenWithdraw = depositedLiquidity
                          .mul(tokenBalance)
                          .div(liquidity)
                      const [ethAmount, tokenAmount] = await dex.callStatic.withdraw(
                          depositedLiquidity
                      )

                      assert.equal(ethAmount.toString(), ETH_VALUE.toString())
                      assert.equal(tokenAmount.toString(), expectedTokenWithdraw.toString())
                  })
              })
          })

          describe("Swap", function () {
              describe("Eth to Token", function () {
                  const ethValueToSwap = ethers.utils.parseEther("0.1")

                  //   beforeEach(async function () {
                  //       await token.approve(dex.address, TOKEN_VALUE)
                  //       await dex.deposit({ value: ETH_VALUE })
                  //   })

                  it("checks null eth value", async function () {
                      await expect(dex.ethToToken()).to.be.revertedWith("DEX_nullValue()")
                  })

                  it("transfers tokens to buyer", async function () {
                      const expectedTokenValue = await dex.getAmountOut(
                          ethValueToSwap,
                          await ethers.provider.getBalance(dex.address),
                          await token.balanceOf(dex.address)
                      )

                      await expect(() =>
                          dex.ethToToken({ value: ethValueToSwap })
                      ).to.changeTokenBalance(token, deployer, expectedTokenValue)
                  })

                  it("receives eth", async function () {
                      await expect(
                          await dex.ethToToken({ value: ethValueToSwap })
                      ).to.changeEtherBalance(dex, ethValueToSwap)
                  })

                  it("emits event Swap ethToToken", async function () {
                      const expectedTokenValue = await dex.getAmountOut(
                          ethValueToSwap,
                          await ethers.provider.getBalance(dex.address),
                          await token.balanceOf(dex.address)
                      )

                      await expect(dex.ethToToken({ value: ethValueToSwap }))
                          .to.emit(dex, "Swap")
                          .withArgs(
                              deployer.address,
                              ethValueToSwap,
                              expectedTokenValue,
                              "ethToToken"
                          )
                  })

                  it("returns token output", async function () {
                      const expectedTokenValue = await dex.getAmountOut(
                          ethValueToSwap,
                          await ethers.provider.getBalance(dex.address),
                          await token.balanceOf(dex.address)
                      )
                      const returnedTokenValue = await dex.callStatic.ethToToken({
                          value: ethValueToSwap,
                      })

                      assert.equal(returnedTokenValue.toString(), expectedTokenValue.toString())
                  })
              })

              describe("Token to Eth", function () {
                  const tokenValueToSwap = ethers.utils.parseEther("100")

                  beforeEach(async function () {
                      await token.approve(dex.address, tokenValueToSwap)
                  })

                  it("checks null token value", async function () {
                      await expect(dex.tokenToEth(0)).to.be.revertedWith("DEX_nullValue()")
                  })

                  it("receives tokens from buyer", async function () {
                      await expect(() => dex.tokenToEth(tokenValueToSwap)).to.changeTokenBalance(
                          token,
                          dex,
                          tokenValueToSwap
                      )
                  })

                  it("transfers eth to buyer", async function () {
                      const expectedEthValue = await dex.getAmountOut(
                          tokenValueToSwap,
                          await token.balanceOf(dex.address),
                          await ethers.provider.getBalance(dex.address)
                      )

                      await expect(await dex.tokenToEth(tokenValueToSwap)).to.changeEtherBalance(
                          deployer,
                          expectedEthValue
                      )
                  })

                  it("emits event Swap tokenToEth", async function () {
                      const expectedEthValue = await dex.getAmountOut(
                          tokenValueToSwap,
                          await token.balanceOf(dex.address),
                          await ethers.provider.getBalance(dex.address)
                      )

                      await expect(dex.tokenToEth(tokenValueToSwap))
                          .to.emit(dex, "Swap")
                          .withArgs(
                              deployer.address,
                              tokenValueToSwap,
                              expectedEthValue,
                              "tokenToEth"
                          )
                  })

                  it("returns eth output", async function () {
                      const expectedEthValue = await dex.getAmountOut(
                          tokenValueToSwap,
                          await token.balanceOf(dex.address),
                          await ethers.provider.getBalance(dex.address)
                      )
                      const returnedEthValue = await dex.callStatic.tokenToEth(tokenValueToSwap)

                      assert.equal(returnedEthValue.toString(), expectedEthValue.toString())
                  })
              })
          })
      })
