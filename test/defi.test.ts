import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("DeFi unit test", function () {
  async function deployExchange() {
    const [deployer] = await ethers.getSigners();

    const initialTokenSupply = ethers.utils.parseUnits("2000", 18);

    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy("NaniSwap", "NST", initialTokenSupply);

    const Exchange = await ethers.getContractFactory("Exchange");
    const exchange = await Exchange.deploy(token.address);

    return { token, exchange, deployer, initialTokenSupply };
  }

  describe("addLiquidity", async () => {
    it("adds liquidity", async () => {
      const { token, exchange, initialTokenSupply } = await loadFixture(
        deployExchange
      );

      const ethLiquidity = ethers.utils.parseEther("100");

      await token.approve(exchange.address, initialTokenSupply);
      await exchange.addLiquidity(initialTokenSupply, { value: ethLiquidity });

      expect(await ethers.provider.getBalance(exchange.address)).to.equal(
        ethLiquidity
      );
      expect(await exchange.getReserve()).to.equal(initialTokenSupply);
    });
  });

  async function deployAddLiquidity() {
    const { deployer, token, exchange, initialTokenSupply } = await loadFixture(
      deployExchange
    );

    const ethLiquidity = ethers.utils.parseUnits("1000", 18);

    await token.approve(exchange.address, initialTokenSupply);
    await exchange.addLiquidity(initialTokenSupply, { value: ethLiquidity });

    return {
      token,
      exchange,
      deployer,
      initialTokenSupply,
      ethLiquidity,
    };
  }

  describe("getTokenAmount", async () => {
    it("returns correct token amount", async () => {
      const { exchange } = await loadFixture(deployAddLiquidity);

      let tokensOut = await exchange.getTokenAmount(
        ethers.utils.parseUnits("1", 18)
      );
      expect(ethers.utils.formatEther(tokensOut)).to.equal(
        "1.978041738678708079"
      );
    });
  });

  describe("getEthAmount", async () => {
    it("returns correct eth amount", async () => {
      const { exchange } = await loadFixture(deployAddLiquidity);

      let ethOut = await exchange.getEthAmount(
        ethers.utils.parseUnits("2", 18)
      );
      expect(ethers.utils.formatEther(ethOut)).to.equal("0.989020869339354039");
    });
  });
});
