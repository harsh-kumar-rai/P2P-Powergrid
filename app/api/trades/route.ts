import { NextResponse } from "next/server"
import db from "@/lib/db"
import { verifyToken, extractToken } from "@/lib/auth"

export async function GET(request: Request) {
  const token = extractToken(request.headers.get("authorization"))
  const payload = token ? verifyToken(token) : null

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await db.execute({
    sql: "SELECT * FROM trades WHERE user_id = ? ORDER BY timestamp DESC LIMIT 50",
    args: [payload.id],
  })

  const trades = result.rows.map((row) => ({
    id: String(row.id),
    type: row.type,
    kwh: Number(row.amount),
    pricePerKwh: Number(row.price),
    total: Number(row.total),
    timestamp: new Date(row.timestamp as string).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    status: "Completed",
    txHash: row.tx_hash,
  }))

  return NextResponse.json(trades)
}
