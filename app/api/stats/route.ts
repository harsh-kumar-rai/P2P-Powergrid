import { NextResponse } from "next/server"
import db from "@/lib/db"

export async function GET() {
  const result = await db.execute({
    sql: "SELECT * FROM grid_stats WHERE id = 1",
    args: [],
  })

  if (result.rows.length === 0) {
    return NextResponse.json({
      gridConsumption: 0,
      netStorage: 0,
      generationOutput: 0,
      netExport: 0,
    })
  }

  const stats = result.rows[0]
  return NextResponse.json({
    gridConsumption: Number(stats.consumption),
    netStorage: Number(stats.storage),
    generationOutput: Number(stats.generation),
    netExport: Number(stats.export_val),
  })
}
