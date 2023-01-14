import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
//import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  TokenKTN__factory,
  TokenKTN,
  Factory__factory,
  Factory,
  Exchange__factory,
  Exchange,
} from "../typechain-types";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";

const toWei = (value: number) => ethers.utils.parseEther(value.toString());

describe("Factory test", () => {
  async function deployFactory() {
    const [deployer]: SignerWithAddress[] = await ethers.getSigners();
    const Token: TokenKTN__factory = await ethers.getContractFactory(
      "TokenKTN"
    );
    const token: TokenKTN = await Token.deploy(
      "NaniSwapV1",
      "NST",
      toWei(123456)
    );
    const Factory: Factory__factory = await ethers.getContractFactory(
      "Factory"
    );
    const factory: Factory = await Factory.deploy();

    return { token, factory, deployer };
  }

  it("deploys", async () => {
    const { factory } = await loadFixture(deployFactory);
    expect(await factory.deployed()).to.equal(factory);
  });

  describe("createExchange", () => {
    it("deploys an exchange", async () => {
      const { factory, token } = await loadFixture(deployFactory);

      const exchangeAddress = await factory.callStatic.createExchange(
        token.address
      );
      await factory.createExchange(token.address);

      expect(await factory.tokenToExchange(token.address)).to.equal(
        exchangeAddress
      );

      const Exchange: Exchange__factory = await ethers.getContractFactory(
        "Exchange"
      );
      const exchange: Exchange = Exchange.attach(exchangeAddress);

      expect(await exchange.name()).to.equal("NaniSwapV1");
      expect(await exchange.symbol()).to.equal("NST");
      expect(await exchange.factoryAddress()).to.equal(factory.address);
    });

    it("doesn't allow zero address", async () => {
      const { factory } = await loadFixture(deployFactory);

      await expect(
        factory.createExchange("0x0000000000000000000000000000000000000000")
      ).to.be.revertedWith("invalid token address");
    });

    it("fails when exchange exists", async () => {
      const { factory, token } = await loadFixture(deployFactory);

      await factory.createExchange(token.address);

      await expect(factory.createExchange(token.address)).to.be.revertedWith(
        "exchange already exists"
      );
    });
  });

  describe("getExchange", () => {
    it("returns exchange address by token address", async () => {
      const { factory, token } = await loadFixture(deployFactory);

      const exchangeAddress = await factory.callStatic.createExchange(
        token.address
      );
      await factory.createExchange(token.address);

      expect(await factory.getExchange(token.address)).to.equal(
        exchangeAddress
      );
    });
  });
});
