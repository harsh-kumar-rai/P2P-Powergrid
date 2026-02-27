import { NextResponse } from "next/server"
import db from "@/lib/db"
import bcrypt from "bcryptjs"
import { signToken } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    const result = await db.execute({
      sql: "SELECT * FROM users WHERE email = ?",
      args: [email],
    })

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    const user = result.rows[0]
    const passwordMatch = await bcrypt.compare(password, user.password as string)

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    const token = signToken({
      id: Number(user.id),
      role: user.role as string,
    })

    return NextResponse.json({
      token,
      user: {
        id: Number(user.id),
        email: user.email,
        role: user.role,
        balance: Number(user.balance),
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Something went wrong during login" },
      { status: 500 }
    )
  }
}
