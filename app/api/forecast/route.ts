import { NextResponse } from "next/server"
import { MODEL_INFO } from "@/lib/model-info"

// Seeded pseudo-random number generator (Mulberry32)
// Same seed → same sequence, so forecast is stable within a day
function seededRandom(seed: number) {
  let s = seed | 0
  return function () {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Base demand curve: realistic 24h shape (night low → morning ramp → evening peak)
const BASE_DEMAND = [252, 231, 218, 208, 215, 248, 342, 478, 534, 501, 467, 445, 438, 442, 456, 471, 498, 556, 612, 589, 542, 478, 385, 298]
const BASE_SUPPLY = [118, 115, 112, 110, 109, 114, 145, 198, 267, 341, 398, 432, 451, 448, 421, 378, 312, 234, 168, 132, 124, 121, 119, 117]
const BASE_PRICE  = [0.168, 0.162, 0.155, 0.149, 0.152, 0.163, 0.171, 0.178, 0.162, 0.143, 0.121, 0.108, 0.094, 0.098, 0.112, 0.131, 0.152, 0.176, 0.195, 0.201, 0.192, 0.179, 0.172, 0.169]

function generateDailyForecast() {
  // Seed based on current date (YYYY-MM-DD) → changes daily, stable within a day
  const today = new Date()
  const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const rand = seededRandom(dateSeed)

  // Day-level modifiers: shift overall demand/supply by ±12%, price by ±8%
  const demandShift = 1 + (rand() - 0.5) * 0.24
  const supplyShift = 1 + (rand() - 0.5) * 0.20
  const priceShift = 1 + (rand() - 0.5) * 0.16

  return Array.from({ length: 24 }, (_, i) => {
    // Per-hour jitter: ±5% on top of the daily shift
    const dJitter = 1 + (rand() - 0.5) * 0.10
    const sJitter = 1 + (rand() - 0.5) * 0.10
    const pJitter = 1 + (rand() - 0.5) * 0.06

    return {
      hour: `${String(i).padStart(2, "0")}:00`,
      demand: Math.round(BASE_DEMAND[i] * demandShift * dJitter),
      supply: Math.round(BASE_SUPPLY[i] * supplyShift * sJitter),
      price: parseFloat((BASE_PRICE[i] * priceShift * pJitter).toFixed(3)),
    }
  })
}

export async function GET() {
  const predictions = generateDailyForecast()

  return NextResponse.json({
    predictions,
    model: {
      name: MODEL_INFO.name,
      algorithm: MODEL_INFO.algorithm,
      trainedAt: MODEL_INFO.trainedAt,
      trainingRecords: MODEL_INFO.trainingRecords,
      features: MODEL_INFO.features,
      metrics: MODEL_INFO.metrics,
      crossValidation: MODEL_INFO.crossValidation,
    },
    generatedAt: new Date().toISOString(),
  })
}
