import { config } from "dotenv"
config({ path: ".env.local" })

import { createClient } from "@libsql/client"
import bcrypt from "bcryptjs"

async function seed() {
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL || "file:local.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  console.log("Creating tables...")

  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'CONSUMER',
      wallet_address TEXT,
      balance REAL DEFAULT 2500.00,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      price REAL NOT NULL,
      total REAL NOT NULL,
      tx_hash TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_id INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS grid_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      consumption REAL,
      storage REAL,
      generation REAL,
      export_val REAL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  const forceReseed = process.argv.includes("--force")
  const existing = await db.execute("SELECT COUNT(*) as count FROM users")
  const count = Number(existing.rows[0].count)

  if (count > 0 && forceReseed) {
    console.log("Force flag detected — dropping and recreating tables...")
    await db.execute("DROP TABLE IF EXISTS trades")
    await db.execute("DROP TABLE IF EXISTS grid_stats")
    await db.execute("DROP TABLE IF EXISTS users")

    await db.execute(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'CONSUMER',
        wallet_address TEXT,
        balance REAL DEFAULT 2500.00,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await db.execute(`
      CREATE TABLE trades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        price REAL NOT NULL,
        total REAL NOT NULL,
        tx_hash TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `)
    await db.execute(`
      CREATE TABLE grid_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        consumption REAL,
        storage REAL,
        generation REAL,
        export_val REAL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
  }

  if (count === 0 || forceReseed) {
    console.log("Seeding initial data...")

    const hashedPassword = await bcrypt.hash("demo123", 12)

    await db.execute({
      sql: "INSERT INTO users (email, password, role, wallet_address, balance) VALUES (?, ?, ?, ?, ?)",
      args: ["demo@powergrid.io", hashedPassword, "CONSUMER", "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", 2457.05],
    })

    await db.execute({
      sql: "INSERT INTO grid_stats (consumption, storage, generation, export_val) VALUES (?, ?, ?, ?)",
      args: [1245.8, 318.2, 458.78, 140.5],
    })

    const demoTrades = [
      { type: "Buy", amount: 25.0, price: 0.142, hours: 2 },
      { type: "Sell", amount: 18.5, price: 0.155, hours: 4 },
      { type: "Buy", amount: 42.0, price: 0.138, hours: 7 },
      { type: "Sell", amount: 10.0, price: 0.161, hours: 11 },
      { type: "Buy", amount: 35.5, price: 0.144, hours: 15 },
      { type: "Sell", amount: 28.0, price: 0.152, hours: 20 },
      { type: "Buy", amount: 15.0, price: 0.135, hours: 26 },
      { type: "Sell", amount: 50.0, price: 0.148, hours: 30 },
      { type: "Buy", amount: 8.5, price: 0.141, hours: 38 },
      { type: "Sell", amount: 22.0, price: 0.157, hours: 44 },
    ]

    for (const trade of demoTrades) {
      const total = parseFloat((trade.amount * trade.price).toFixed(4))
      const hash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
      const ts = new Date(Date.now() - trade.hours * 3600000).toISOString()

      await db.execute({
        sql: "INSERT INTO trades (type, amount, price, total, tx_hash, timestamp, user_id) VALUES (?, ?, ?, ?, ?, ?, 1)",
        args: [trade.type, trade.amount, trade.price, total, hash, ts],
      })
    }

    console.log("Inserted 10 demo trades")

    console.log("Seed complete. Demo account: demo@powergrid.io / demo123")
  } else {
    console.log("Database already has data, skipping seed.")
  }

  process.exit(0)
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
