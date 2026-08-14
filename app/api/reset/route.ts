import { NextResponse } from "next/server"
import db from "@/lib/db"

export async function POST() {
  try {
    await db.execute("UPDATE grid_stats SET consumption = 1245.8, storage = 318.2, generation = 458.78, export_val = 140.5 WHERE id = 1")
    await db.execute("DELETE FROM trades")

    return NextResponse.json({ success: true, message: "Demo environment reset" })
  } catch (error) {
    console.error("Reset error:", error)
    return NextResponse.json(
      { error: "Failed to reset demo" },
      { status: 500 }
    )
  }
}
