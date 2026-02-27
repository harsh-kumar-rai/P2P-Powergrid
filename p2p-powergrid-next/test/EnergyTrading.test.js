const { expect } = require("chai")
const { ethers } = require("hardhat")
const { BigNumber } = require("ethers")

// Helper: ethers v5 compatible parseEther
const parseEther = (val) => ethers.utils.parseEther(val)

describe("EnergyTrading Contract", function () {
  let trading, token, owner, buyer, seller

  beforeEach(async function () {
    ;[owner, buyer, seller] = await ethers.getSigners()

    const EnergyToken = await ethers.getContractFactory("EnergyToken")
    token = await EnergyToken.deploy(parseEther("1000000"))

    const EnergyTrading = await ethers.getContractFactory("EnergyTrading")
    trading = await EnergyTrading.deploy(token.address)

    await token.mint(buyer.address, parseEther("10000"))
  })

  describe("Deployment", function () {
    it("should set the correct owner", async function () {
      expect(await trading.owner()).to.equal(owner.address)
    })

    it("should set the correct energy token address", async function () {
      expect(await trading.energyToken()).to.equal(token.address)
    })

    it("should start with zero trades", async function () {
      expect(await trading.getTradeCount()).to.equal(0)
    })
  })

  describe("Trade Initiation", function () {
    it("should create a trade with correct details", async function () {
      const energyAmount = parseEther("100")
      const price = parseEther("0.15")
      await trading.connect(buyer).initiateTrade(seller.address, energyAmount, price)
      expect(await trading.getTradeCount()).to.equal(1)
      const trade = await trading.getTrade(0)
      expect(trade.buyer).to.equal(buyer.address)
      expect(trade.energyAmount).to.equal(energyAmount)
      expect(trade.settled).to.be.false
    })

    it("should emit TradeInitiated event", async function () {
      const energyAmount = parseEther("50")
      const price = parseEther("0.14")
      await expect(trading.connect(buyer).initiateTrade(seller.address, energyAmount, price))
        .to.emit(trading, "TradeInitiated")
        .withArgs(buyer.address, seller.address, energyAmount, price)
    })

    it("should reject self-trading", async function () {
      await expect(
        trading.connect(buyer).initiateTrade(buyer.address, parseEther("10"), parseEther("0.1"))
      ).to.be.revertedWith("Cannot trade with oneself")
    })

    it("should reject zero energy amount", async function () {
      await expect(
        trading.connect(buyer).initiateTrade(seller.address, 0, parseEther("0.1"))
      ).to.be.revertedWith("Energy amount must be > 0")
    })

    it("should handle multiple trades", async function () {
      await trading.connect(buyer).initiateTrade(seller.address, parseEther("25"), parseEther("0.12"))
      await trading.connect(buyer).initiateTrade(seller.address, parseEther("50"), parseEther("0.15"))
      await trading.connect(buyer).initiateTrade(seller.address, parseEther("75"), parseEther("0.18"))
      expect(await trading.getTradeCount()).to.equal(3)
    })
  })

  describe("Trade Query", function () {
    it("should revert for invalid trade ID", async function () {
      await expect(trading.getTrade(999)).to.be.revertedWith("Invalid trade ID")
    })
  })

  describe("EnergyToken (ETK)", function () {
    it("should have correct name and symbol", async function () {
      expect(await token.name()).to.equal("EnergyToken")
      expect(await token.symbol()).to.equal("ETK")
    })

    it("should mint tokens correctly to buyer", async function () {
      const balance = await token.balanceOf(buyer.address)
      expect(balance).to.equal(parseEther("10000"))
    })
  })
})
