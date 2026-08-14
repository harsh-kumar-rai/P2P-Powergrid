import { NextResponse } from "next/server"
import db from "@/lib/db"
import bcrypt from "bcryptjs"
import { signToken } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { email, password, role } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    const existing = await db.execute({
      sql: "SELECT id FROM users WHERE email = ?",
      args: [email],
    })

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const userRole = role || "CONSUMER"
    const initialBalance = 2500.0

    const result = await db.execute({
      sql: "INSERT INTO users (email, password, role, balance) VALUES (?, ?, ?, ?)",
      args: [email, hashedPassword, userRole, initialBalance],
    })

    const userId = Number(result.lastInsertRowid)
    const token = signToken({ id: userId, role: userRole })

    return NextResponse.json({
      token,
      user: { id: userId, email, role: userRole, balance: initialBalance },
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "Something went wrong during registration" },
      { status: 500 }
    )
  }
}
