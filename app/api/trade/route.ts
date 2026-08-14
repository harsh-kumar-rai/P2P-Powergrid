import { NextResponse } from "next/server"
import db from "@/lib/db"
import { verifyToken, extractToken } from "@/lib/auth"
import { generateTxHash } from "@/lib/utils"

export async function POST(request: Request) {
  const token = extractToken(request.headers.get("authorization"))
  const payload = token ? verifyToken(token) : null

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { type } = body

    // ── Input Validation ──────────────────────────────────────
    if (type !== "Buy" && type !== "Sell") {
      return NextResponse.json(
        { error: "Invalid trade type. Must be 'Buy' or 'Sell'" },
        { status: 400 }
      )
    }

    const amount = parseFloat(body.amount)
    const price = parseFloat(body.price)

    if (isNaN(amount) || amount <= 0 || amount > 100_000) {
      return NextResponse.json(
        { error: "Amount must be a positive number (max 100,000 kWh)" },
        { status: 400 }
      )
    }

    if (isNaN(price) || price <= 0 || price > 100) {
      return NextResponse.json(
        { error: "Price must be a positive number (max 100 ETK/kWh)" },
        { status: 400 }
      )
    }

    const total = amount * price
    const userId = payload.id
    const txHash = generateTxHash()

    // ── Check balance ─────────────────────────────────────────
    const userResult = await db.execute({
      sql: "SELECT balance FROM users WHERE id = ?",
      args: [userId],
    })

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const balance = Number(userResult.rows[0].balance)

    if (type === "Buy" && balance < total) {
      return NextResponse.json(
        { error: "Insufficient balance for this trade" },
        { status: 400 }
      )
    }

    const newBalance = type === "Buy" ? balance - total : balance + total

    // ── Atomic DB Transaction (batch) ─────────────────────────
    // All 3 operations execute as a single atomic unit.
    // If any fails, none are committed.
    const gridStatsSql =
      type === "Buy"
        ? { sql: "UPDATE grid_stats SET consumption = consumption + ? WHERE id = 1", args: [amount] }
        : { sql: "UPDATE grid_stats SET storage = storage + ?, export_val = export_val + ? WHERE id = 1", args: [amount, amount] }

    await db.batch(
      [
        { sql: "UPDATE users SET balance = ? WHERE id = ?", args: [newBalance, userId] },
        gridStatsSql,
        {
          sql: "INSERT INTO trades (type, amount, price, total, tx_hash, user_id) VALUES (?, ?, ?, ?, ?, ?)",
          args: [type, amount, price, total, txHash, userId],
        },
      ],
      "write"
    )

    return NextResponse.json({
      success: true,
      trade: {
        id: txHash.slice(0, 8),
        type,
        kwh: amount,
        pricePerKwh: price,
        total,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "Completed",
        txHash,
      },
      newBalance,
    })
  } catch (error) {
    console.error("Trade error:", error)
    return NextResponse.json(
      { error: "Trade execution failed" },
      { status: 500 }
    )
  }
}
