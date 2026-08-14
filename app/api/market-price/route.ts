import { NextResponse } from "next/server"

let currentPrice = 0.142

export async function GET() {
  const volatility = (Math.random() - 0.5) * 0.005
  currentPrice = Math.max(0.05, Math.min(0.50, currentPrice + volatility))

  return NextResponse.json({
    price: parseFloat(currentPrice.toFixed(3)),
  })
}
