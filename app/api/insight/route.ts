import { NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return NextResponse.json({
      insight: "Grid optimization active. Market conditions nominal — standard trading protocols recommended.",
    })
  }

  try {
    const { currentPrice, gridLoad, renewableMix } = await request.json()

    const ai = new GoogleGenAI({ apiKey })

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Act as an advanced energy grid AI analyst for a P2P trading platform.
Current Market State:
- Token Price: ${currentPrice} ETK/kWh
- Grid Load: ${gridLoad}%
- Renewable Mix: ${renewableMix}%

Provide a very short, 1-sentence strategic advice for a prosumer.
Keep it professional, futuristic, and actionable.`,
      config: {
        maxOutputTokens: 60,
        temperature: 0.7,
      },
    })

    const text = response.text?.trim()

    return NextResponse.json({
      insight: text || "Market stability nominal. Grid optimization active.",
    })
  } catch (error) {
    console.error("Gemini API error:", error)
    return NextResponse.json({
      insight: "Market analysis temporarily unavailable. Proceed with standard trading protocols.",
    })
  }
}
