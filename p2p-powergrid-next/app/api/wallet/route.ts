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
    sql: "SELECT balance FROM users WHERE id = ?",
    args: [payload.id],
  })

  const balance = result.rows.length > 0 ? Number(result.rows[0].balance) : 0

  return NextResponse.json({ balance })
}
