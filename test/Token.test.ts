import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
//import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { TokenKTN__factory, TokenKTN } from "../typechain-types";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";

describe("Token test", () => {
  //let owner: SignerWithAddress;
  //let token: TokenKTN;

  async function deployToken() {
    const [deployer]: SignerWithAddress[] = await ethers.getSigners();
    const initialTokenSupply: BigNumber = ethers.utils.parseUnits("123", 18);

    const Token: TokenKTN__factory = await ethers.getContractFactory(
      "TokenKTN"
    );
    const token: TokenKTN = await Token.deploy(
      "NaniSwap",
      "NST",
      initialTokenSupply
    );

    return { deployer, initialTokenSupply, token };
  }

  //   beforeEach(async function () {
  //     const { deployer, initialTokenSupply, token } = await loadFixture(
  //       deployToken
  //     );
  //   });

  it("sets name and symbol when created", async () => {
    const { deployer, initialTokenSupply, token } = await loadFixture(
      deployToken
    );

    expect(await token.name()).to.equal("NaniSwap");
    expect(await token.symbol()).to.equal("NST");
  });

  it("mints initialSupply to msg.sender when created", async () => {
    const { deployer, initialTokenSupply, token } = await loadFixture(
      deployToken
    );

    expect(await token.totalSupply()).to.equal(initialTokenSupply);
    expect(await token.balanceOf(deployer.address)).to.equal(
      initialTokenSupply
    );
  });
});
