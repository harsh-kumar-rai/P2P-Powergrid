/**
 * API Integration Tests — P2P PowerGrid
 *
 * Runs against the live dev server (http://localhost:3000).
 * Usage: node scripts/api-test.js
 */

const BASE = "http://localhost:3000/api"
let passed = 0
let failed = 0
let token = null

async function test(name, fn) {
  try {
    await fn()
    passed++
    console.log(`  ✅ ${name}`)
  } catch (err) {
    failed++
    console.log(`  ❌ ${name}`)
    console.log(`     ${err.message}`)
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || "Assertion failed")
}

// ─── Auth Tests ───────────────────────────────────────────────

async function authTests() {
  console.log("\n🔐 Auth")

  await test("POST /auth/login — valid credentials", async () => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "demo@powergrid.io", password: "demo123" }),
    })
    assert(res.status === 200, `Expected 200, got ${res.status}`)
    const data = await res.json()
    assert(data.token, "Missing token in response")
    assert(data.user.email === "demo@powergrid.io", "Wrong email")
    assert(typeof data.user.balance === "number", "Balance should be a number")
    token = data.token
  })

  await test("POST /auth/login — wrong password returns 401", async () => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "demo@powergrid.io", password: "wrong" }),
    })
    assert(res.status === 401, `Expected 401, got ${res.status}`)
  })

  await test("POST /auth/login — missing fields returns 400", async () => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    assert(res.status === 400, `Expected 400, got ${res.status}`)
  })
}

// ─── Stats Tests ──────────────────────────────────────────────

async function statsTests() {
  console.log("\n📊 Stats")

  await test("GET /stats — returns grid data", async () => {
    const res = await fetch(`${BASE}/stats`)
    assert(res.status === 200, `Expected 200, got ${res.status}`)
    const data = await res.json()
    assert(typeof data.gridConsumption === "number", "gridConsumption should be number")
    assert(typeof data.netStorage === "number", "netStorage should be number")
    assert(typeof data.generationOutput === "number", "generationOutput should be number")
    assert(typeof data.netExport === "number", "netExport should be number")
  })
}

// ─── Forecast Tests ───────────────────────────────────────────

async function forecastTests() {
  console.log("\n🧠 Forecast")

  await test("GET /forecast — returns predictions + model", async () => {
    const res = await fetch(`${BASE}/forecast`)
    assert(res.status === 200, `Expected 200, got ${res.status}`)
    const data = await res.json()
    assert(Array.isArray(data.predictions), "predictions should be array")
    assert(data.predictions.length === 24, `Expected 24 predictions, got ${data.predictions.length}`)
    assert(data.model, "model metadata missing")
    assert(data.model.metrics.r2_demand > 0.9, "R² should be > 0.9")
    const point = data.predictions[0]
    assert(point.hour && point.demand && point.supply && point.price, "Missing forecast fields")
  })
}

// ─── Market Price Tests ───────────────────────────────────────

async function marketPriceTests() {
  console.log("\n💰 Market Price")

  await test("GET /market-price — returns price in range", async () => {
    const res = await fetch(`${BASE}/market-price`)
    assert(res.status === 200, `Expected 200, got ${res.status}`)
    const data = await res.json()
    assert(typeof data.price === "number", "price should be number")
    assert(data.price >= 0.05 && data.price <= 0.50, `Price ${data.price} out of range`)
  })
}

// ─── Protected Routes Tests ─────────────────────────────────

async function protectedTests() {
  console.log("\n🔒 Protected Routes")

  await test("GET /trades — 401 without token", async () => {
    const res = await fetch(`${BASE}/trades`)
    assert(res.status === 401, `Expected 401, got ${res.status}`)
  })

  await test("GET /trades — 200 with valid token", async () => {
    const res = await fetch(`${BASE}/trades`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    assert(res.status === 200, `Expected 200, got ${res.status}`)
    const data = await res.json()
    assert(Array.isArray(data), "Response should be an array")
    assert(data.length > 0, "Should have demo trades")
    const trade = data[0]
    assert(trade.type, "Trade missing type")
    assert(trade.kwh, "Trade missing kwh")
    assert(trade.status === "Completed", "Trade status should be Completed")
  })

  await test("GET /wallet — 401 without token", async () => {
    const res = await fetch(`${BASE}/wallet`)
    assert(res.status === 401, `Expected 401, got ${res.status}`)
  })

  await test("GET /wallet — returns balance with token", async () => {
    const res = await fetch(`${BASE}/wallet`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    assert(res.status === 200, `Expected 200, got ${res.status}`)
    const data = await res.json()
    assert(typeof data.balance === "number", "balance should be number")
    assert(data.balance > 0, "balance should be > 0")
  })
}

// ─── Trade Execution Tests ──────────────────────────────────

async function tradeTests() {
  console.log("\n⚡ Trade Execution")

  await test("POST /trade — 401 without token", async () => {
    const res = await fetch(`${BASE}/trade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "Buy", amount: 10, price: 0.14 }),
    })
    assert(res.status === 401, `Expected 401, got ${res.status}`)
  })

  await test("POST /trade — executes a buy trade", async () => {
    const res = await fetch(`${BASE}/trade`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ type: "Buy", amount: 5, price: 0.14 }),
    })
    assert(res.status === 200, `Expected 200, got ${res.status}`)
    const data = await res.json()
    assert(data.trade, "Response should contain trade object")
    assert(data.trade.type === "Buy", "Trade type should be Buy")
  })
}

// ─── Runner ─────────────────────────────────────────────────

async function run() {
  console.log("═══════════════════════════════════════")
  console.log("  P2P PowerGrid — API Integration Tests")
  console.log("═══════════════════════════════════════")

  // Check server is running
  try {
    await fetch(BASE)
  } catch {
    console.error("\n❌ Dev server not running. Start with: npm run dev\n")
    process.exit(1)
  }

  await authTests()
  await statsTests()
  await forecastTests()
  await marketPriceTests()
  await protectedTests()
  await tradeTests()

  console.log("\n═══════════════════════════════════════")
  console.log(`  Results: ${passed} passed, ${failed} failed`)
  console.log("═══════════════════════════════════════\n")

  process.exit(failed > 0 ? 1 : 0)
}

run()
