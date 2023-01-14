import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
//import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  TokenKTN__factory,
  TokenKTN,
  Exchange__factory,
  Exchange,
} from "../typechain-types";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";

describe("Exchange test", function () {
  async function deployExchange() {
    const [deployer]: SignerWithAddress[] = await ethers.getSigners();
    const initialTokenSupply: BigNumber = ethers.utils.parseUnits("2000", 18);
    const Token: TokenKTN__factory = await ethers.getContractFactory(
      "TokenKTN"
    );
    const token: TokenKTN = await Token.deploy(
      "NaniSwapV1",
      "NST",
      initialTokenSupply
    );
    const Exchange: Exchange__factory = await ethers.getContractFactory(
      "Exchange"
    );
    const exchange: Exchange = await Exchange.deploy(token.address);

    return { token, exchange, deployer, initialTokenSupply };
  }

  it("deploys", async () => {
    const { deployer, exchange } = await loadFixture(deployExchange);

    expect(await exchange.deployed()).to.equal(exchange);
    expect(await exchange.name()).to.equal("NaniSwapV1");
    expect(await exchange.symbol()).to.equal("NST");
    expect(await exchange.totalSupply()).to.equal(0);
    expect(await exchange.factoryAddress()).to.equal(deployer.address);
  });

  describe("addLiquidity", async () => {
    it("adds liquidity", async () => {
      const { token, exchange, initialTokenSupply } = await loadFixture(
        deployExchange
      );

      const ethLiquidity: BigNumber = ethers.utils.parseEther("1000");

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

    const ethLiquidity: BigNumber = ethers.utils.parseUnits("1000", 18);

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

      const tokensOut = await exchange.getTokenAmount(
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

      const ethOut = await exchange.getEthAmount(
        ethers.utils.parseUnits("2", 18)
      );
      expect(ethers.utils.formatEther(ethOut)).to.equal("0.989020869339354039");
    });
  });
});
