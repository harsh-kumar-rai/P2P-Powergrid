const API_BASE = "/api"

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export function setToken(token: string) {
  localStorage.setItem("auth_token", token)
}

export function getToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
}

export function removeToken() {
  localStorage.removeItem("auth_token")
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || "Login failed")
  }
  return res.json()
}

export async function signup(email: string, password: string, role: string) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || "Signup failed")
  }
  return res.json()
}

export async function fetchTrades() {
  try {
    const res = await fetch(`${API_BASE}/trades`, { headers: getAuthHeaders() })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function fetchMarketPrice() {
  try {
    const res = await fetch(`${API_BASE}/market-price`)
    if (!res.ok) return null
    const data = await res.json()
    return data.price
  } catch {
    return null
  }
}

export async function fetchWalletBalance() {
  try {
    const res = await fetch(`${API_BASE}/wallet`, { headers: getAuthHeaders() })
    if (!res.ok) return null
    const data = await res.json()
    return data.balance
  } catch {
    return null
  }
}

export async function executeTrade(type: string, amount: number, price: number) {
  const res = await fetch(`${API_BASE}/trade`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ type, amount, price }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || "Trade failed")
  }
  return res.json()
}

export async function fetchGridStats() {
  try {
    const res = await fetch(`${API_BASE}/stats`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function fetchInsight(currentPrice: number, gridLoad: number, renewableMix: number) {
  try {
    const res = await fetch(`${API_BASE}/insight`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPrice, gridLoad, renewableMix }),
    })
    if (!res.ok) return "Market analysis unavailable."
    const data = await res.json()
    return data.insight
  } catch {
    return "Market analysis temporarily unavailable."
  }
}

export async function fetchForecast() {
  try {
    const res = await fetch(`${API_BASE}/forecast`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function resetDemo() {
  const res = await fetch(`${API_BASE}/reset`, { method: "POST" })
  if (!res.ok) throw new Error("Reset failed")
  return res.json()
}
