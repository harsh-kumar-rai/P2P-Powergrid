const { ethers } = require("hardhat")

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log("Deploying P2P PowerGrid contracts with account:", deployer.address)
  console.log("Network:", (await ethers.provider.getNetwork()).name, "\n")

  // Deploy EnergyToken (ETK)
  const EnergyToken = await ethers.getContractFactory("EnergyToken")
  const initialSupply = ethers.utils.parseEther("10000000") // 10M ETK
  const token = await EnergyToken.deploy(initialSupply)
  await token.deployed()
  console.log("✅ EnergyToken (ETK) deployed to:", token.address)

  // Deploy EnergyTrading
  const EnergyTrading = await ethers.getContractFactory("EnergyTrading")
  const trading = await EnergyTrading.deploy(token.address)
  await trading.deployed()
  console.log("✅ EnergyTrading deployed to:", trading.address)

  console.log("\n--- Deployment Summary ---")
  console.log("EnergyToken:", token.address)
  console.log("EnergyTrading:", trading.address)
  console.log("\nAdd to .env.local:")
  console.log(`NEXT_PUBLIC_TOKEN_ADDRESS=${token.address}`)
  console.log(`NEXT_PUBLIC_TRADING_ADDRESS=${trading.address}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
