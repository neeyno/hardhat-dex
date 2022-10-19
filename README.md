<div align="center">
 <h3 align="center">Dex</h3>
  <p align="center">
    Basic decentralized exchange app
    <br />
    <a href="https://github.com/neeyno/hardhat-dex" target="_blank" >
      <strong>| Explore Smart Contract </strong>
    </a>
    <a  href="https://github.com/neeyno/nextjs-dex" target="_blank">
    <strong>| Explore Frontend |</strong>
    </a>
    <br />
    <a  href="https://jolly-shape-2407.on.fleek.co/" target="_blank"><strong>| View DEMO |</strong></a>
 </p>
</div>
<hr>

### Description
The decentralized exchange smart contract allows any user to swap ETH token in exchange to ERC-20 tokens and vise versa. The contract implements the Automated Market Maker (AMM) and Liquidity Pool. Dex market based on an x*y=k price curve that maintains liquidity. These features encourage users to supply assets to the Liquidity pool and gain profits on trading fee. At the current state the contract supports one token pair.
<hr>

## Getting Started
### Requirements
- git `git --version`
- Nodejs `node --version`
- Yarn `yarn --version` instead of npm 
- clone repo

```bash
git clone https://github.com/neeyno/hardhat-dex
cd hardhat-dex
yarn
```

## Usage
- Deploy
```bash
yarn hardhat deploy
```
- Test
```bash
yarn hardhat test
```