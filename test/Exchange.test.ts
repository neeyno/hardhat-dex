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

const toWei = (value: number) => ethers.utils.parseEther(value.toString());
const fromWei = (value: BigNumber) => ethers.utils.formatEther(value);

describe("Exchange test", function () {
  // let deployer: SignerWithAddress;
  // let token: TokenKTN;
  // let exchange: Exchange;

  async function deployExchange() {
    const [deployer, user]: SignerWithAddress[] = await ethers.getSigners();
    const Token: TokenKTN__factory = await ethers.getContractFactory(
      "TokenKTN"
    );
    const token: TokenKTN = await Token.deploy(
      "NaniSwapV1",
      "NST",
      toWei(999999)
    );
    const Exchange: Exchange__factory = await ethers.getContractFactory(
      "Exchange"
    );
    const exchange: Exchange = await Exchange.deploy(token.address);

    return { token, exchange, deployer, user };
  }

  async function deployAddLiquidity() {
    const { deployer, token, exchange, user } = await loadFixture(
      deployExchange
    );

    await token.approve(exchange.address, toWei(300));
    await exchange.addLiquidity(toWei(200), { value: toWei(100) });

    return {
      token,
      exchange,
      deployer,
      user,
    };
  }

  /* 
  TEST
  */

  it("deploys", async () => {
    const { deployer, exchange } = await loadFixture(deployExchange);

    expect(await exchange.deployed()).to.equal(exchange);
    expect(await exchange.name()).to.equal("NaniSwapV1");
    expect(await exchange.symbol()).to.equal("NST");
    expect(await exchange.totalSupply()).to.equal(0);
    expect(await exchange.factoryAddress()).to.equal(deployer.address);
  });

  describe("addLiquidity", async () => {
    describe("empty reserves", async () => {
      it("adds liquidity", async () => {
        const { token, exchange } = await loadFixture(deployExchange);

        await token.approve(exchange.address, toWei(222));
        await exchange.addLiquidity(toWei(222), { value: toWei(111) });

        expect(await ethers.provider.getBalance(exchange.address)).to.equal(
          toWei(111)
        );
        expect(await exchange.getReserve()).to.equal(toWei(222));
      });

      it("mints LP tokens", async () => {
        const { token, exchange, deployer } = await loadFixture(deployExchange);

        await token.approve(exchange.address, toWei(333));
        await exchange.addLiquidity(toWei(333), { value: toWei(111) });

        expect(await exchange.balanceOf(deployer.address)).to.eq(toWei(111));
        expect(await exchange.totalSupply()).to.eq(toWei(111));
      });
    });

    describe("existing reserves", async () => {
      it("preserves exchange rate", async () => {
        const { exchange } = await loadFixture(deployAddLiquidity);

        await exchange.addLiquidity(toWei(100), { value: toWei(50) });
        expect(await ethers.provider.getBalance(exchange.address)).to.equal(
          toWei(150)
        );
        expect(await exchange.getReserve()).to.equal(toWei(300));
      });

      it("mints LP tokens", async () => {
        const { exchange, deployer } = await loadFixture(deployAddLiquidity);

        await exchange.addLiquidity(toWei(100), { value: toWei(50) });

        expect(await exchange.balanceOf(deployer.address)).to.eq(toWei(150));
        expect(await exchange.totalSupply()).to.eq(toWei(150));
      });

      it("fails when not enough tokens", async () => {
        const { exchange } = await loadFixture(deployAddLiquidity);

        await expect(
          exchange.addLiquidity(toWei(50), { value: toWei(50) })
        ).to.be.revertedWith("insufficient token amount");
      });
    });
  });

  describe("removeLiquidity", async () => {
    it("removes some liquidity", async () => {
      const { exchange, deployer, token } = await loadFixture(
        deployAddLiquidity
      );

      const userEtherBalanceBefore = await ethers.provider.getBalance(
        deployer.address
      );
      const userTokenBalanceBefore = await token.balanceOf(deployer.address);

      await exchange.removeLiquidity(toWei(25)); // 1/4 of 100

      expect(await exchange.getReserve()).to.equal(toWei(150));
      expect(await ethers.provider.getBalance(exchange.address)).to.equal(
        toWei(75)
      );

      const userEtherBalanceAfter = await ethers.provider.getBalance(
        deployer.address
      );
      const userTokenBalanceAfter = await token.balanceOf(deployer.address);

      expect(
        fromWei(userEtherBalanceAfter.sub(userEtherBalanceBefore))
      ).to.equal("24.99990880423146734"); // 25 - gas fees

      expect(
        fromWei(userTokenBalanceAfter.sub(userTokenBalanceBefore))
      ).to.equal("50.0");
    });

    it("removes all liquidity", async () => {
      const { exchange, deployer, token } = await loadFixture(
        deployAddLiquidity
      );

      const userEtherBalanceBefore = await ethers.provider.getBalance(
        deployer.address
      );
      const userTokenBalanceBefore = await token.balanceOf(deployer.address);

      await exchange.removeLiquidity(toWei(100));

      expect(await exchange.getReserve()).to.equal(toWei(0));
      expect(await ethers.provider.getBalance(exchange.address)).to.equal(
        toWei(0)
      );

      const userEtherBalanceAfter = await ethers.provider.getBalance(
        deployer.address
      );
      const userTokenBalanceAfter = await token.balanceOf(deployer.address);

      expect(
        fromWei(userEtherBalanceAfter.sub(userEtherBalanceBefore))
      ).to.equal("99.999927043385173872"); // 100 - gas fees

      expect(
        fromWei(userTokenBalanceAfter.sub(userTokenBalanceBefore))
      ).to.equal("200.0");
    });

    it("pays for provided liquidity", async () => {
      const { exchange, deployer, token, user } = await loadFixture(
        deployAddLiquidity
      );

      const userEtherBalanceBefore = await ethers.provider.getBalance(
        deployer.address
      );
      const userTokenBalanceBefore = await token.balanceOf(deployer.address);

      await exchange
        .connect(user)
        .ethToTokenSwap(toWei(18), { value: toWei(10) });

      await exchange.removeLiquidity(toWei(100));

      expect(await exchange.getReserve()).to.equal(toWei(0));
      expect(await ethers.provider.getBalance(exchange.address)).to.equal(
        toWei(0)
      );
      expect(fromWei(await token.balanceOf(user.address))).to.equal(
        "18.01637852593266606"
      );

      const userEtherBalanceAfter = await ethers.provider.getBalance(
        deployer.address
      );
      const userTokenBalanceAfter = await token.balanceOf(deployer.address);

      expect(
        fromWei(userEtherBalanceAfter.sub(userEtherBalanceBefore))
      ).to.equal("109.999930172324261212"); // 110 - gas fees

      expect(
        fromWei(userTokenBalanceAfter.sub(userTokenBalanceBefore))
      ).to.equal("181.98362147406733394");
    });

    it("burns LP-tokens", async () => {
      const { exchange, deployer } = await loadFixture(deployAddLiquidity);

      await expect(() =>
        exchange.removeLiquidity(toWei(25))
      ).to.changeTokenBalance(exchange, deployer, toWei(-25));

      expect(await exchange.totalSupply()).to.equal(toWei(75));
    });

    it("doesn't allow invalid amount", async () => {
      const { exchange } = await loadFixture(deployAddLiquidity);

      await expect(exchange.removeLiquidity(toWei(100.1))).to.be.reverted; //With("burn amount exceeds balance");
    });
  });

  describe("getTokenAmount", async () => {
    it("returns correct token amount", async () => {
      const { exchange } = await loadFixture(deployAddLiquidity);

      const tokensOut = await exchange.getTokenAmount(toWei(1));
      expect(fromWei(tokensOut)).to.equal("1.960590157441330824");
    });
  });

  describe("getEthAmount", async () => {
    it("returns correct eth amount", async () => {
      const { exchange } = await loadFixture(deployAddLiquidity);

      const ethOut = await exchange.getEthAmount(toWei(2));

      expect(fromWei(ethOut)).to.equal("0.980295078720665412");
    });
  });
});
