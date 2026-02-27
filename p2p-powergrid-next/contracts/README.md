# Smart Contracts — P2P PowerGrid

## Overview

This directory contains the Solidity smart contracts for the P2P PowerGrid energy trading platform.

| Contract | Description |
|----------|-------------|
| `EnergyTrading.sol` | Core trading contract — initiates and settles peer-to-peer energy trades |
| `EnergyToken.sol` | ERC-20 token representing grid energy credits (ETK) |

## Architecture

```
Buyer → initiateTrade() → EnergyTrading.sol → Trade stored on-chain
                                ↓
Settler → settleTrade() → ETK transferred (buyer → seller)
                         → ETH payment sent to seller
                                ↓
                         TradeSettled event emitted
```

## Compile

```bash
npx hardhat compile
```

## Test

```bash
npx hardhat test
```

### Test Coverage

| Test | Description |
|------|-------------|
| Deployment | Verifies owner, token address, zero initial trades |
| Trade Initiation | Creates trade, validates fields, emits event |
| Edge Cases | Self-trade rejection, zero amount rejection |
| Multiple Trades | Handles batch trade creation |
| Invalid Query | Reverts for non-existent trade ID |
| ERC-20 Token | Name, symbol, mint verification |

## Deploy to Sepolia

1. Get Sepolia testnet ETH from [sepoliafaucet.com](https://sepoliafaucet.com)
2. Add to `.env.local`:
   ```
   SEPOLIA_RPC_URL=https://rpc.sepolia.org
   DEPLOYER_PRIVATE_KEY=your_private_key
   ```
3. Deploy:
   ```bash
   npx hardhat run scripts/deploy.ts --network sepolia
   ```
4. Verify on Etherscan:
   ```bash
   npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARG>
   ```

## Contract API

### `initiateTrade(seller, energyAmount, price)`
Creates a new P2P energy trade between caller (buyer) and seller.

### `settleTrade(tradeId)`
Settles a trade — transfers ETK tokens and ETH payment. Must send exact `energyAmount × price` as `msg.value`.

### `getTradeCount() → uint256`
Returns the total number of trades.

### `getTrade(tradeId) → (buyer, seller, energyAmount, price, settled)`
Returns details of a specific trade.
