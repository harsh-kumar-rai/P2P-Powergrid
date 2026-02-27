export function generateTxHash(): string {
  const chars = "0123456789abcdef"
  let hash = "0x"
  for (let i = 0; i < 40; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)]
  }
  return hash
}

export function formatCurrency(value: number, decimals = 2): string {
  return value.toFixed(decimals)
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export function generatePriceHistory(points = 20, basePrice = 0.14) {
  const data = []
  let price = basePrice
  const now = new Date()
  for (let i = points; i > 0; i--) {
    price = price * (1 + (Math.random() - 0.5) * 0.02)
    const time = new Date(now.getTime() - i * 60000)
    data.push({
      time: formatTime(time),
      price: parseFloat(price.toFixed(3)),
    })
  }
  return data
}

export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ")
}
