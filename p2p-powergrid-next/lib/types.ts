export enum UserRole {
  CONSUMER = "CONSUMER",
  INDUSTRY = "INDUSTRY",
}

export enum TradeType {
  BUY = "Buy",
  SELL = "Sell",
}

export interface Trade {
  id: string
  type: string
  kwh: number
  pricePerKwh: number
  total: number
  timestamp: string
  status: "Completed" | "Pending" | "Failed"
  txHash?: string
}

export interface Transaction {
  id: string
  type: string
  amount: number
  currency: string
  timestamp: string
  status: "Completed" | "Pending"
}

export interface MarketDataPoint {
  time: string
  price: number
}

export interface GridStats {
  gridConsumption: number
  netStorage: number
  generationOutput: number
  netExport: number
}

export interface ForecastPoint {
  hour: string
  demand: number
  supply: number
  price: number
}

export interface AuthResponse {
  token: string
  user: {
    id: number
    email: string
    role: string
    balance: number
  }
}
