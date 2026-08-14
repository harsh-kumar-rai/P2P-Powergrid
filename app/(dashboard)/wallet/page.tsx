"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Download, Upload, CheckCircle, TrendingUp, TrendingDown, Zap, Copy, Check, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts"
import { Card, Badge } from "@/components/ui"
import { fetchWalletBalance, fetchTrades } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import type { Trade } from "@/lib/types"
import toast from "react-hot-toast"

// Animated count-up
function AnimatedNumber({ value, decimals = 2 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(0)
  const prev = useRef(0)

  useEffect(() => {
    const start = prev.current
    const diff = value - start
    if (diff === 0) return
    const t0 = performance.now()
    let raf: number
    function tick(now: number) {
      const p = Math.min((now - t0) / 800, 1)
      setDisplay(start + diff * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
      else prev.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])

  return <>{display.toFixed(decimals)}</>
}

function generateBalanceHistory(balance: number) {
  const points = []
  let val = balance * 0.6
  for (let i = 0; i < 14; i++) {
    val += (Math.random() - 0.35) * (balance * 0.06)
    val = Math.max(val, balance * 0.3)
    points.push({
      day: `${i + 1}d`,
      balance: parseFloat(val.toFixed(2)),
    })
  }
  points.push({ day: "Now", balance })
  return points
}

export default function WalletPage() {
  const [balance, setBalance] = useState(0)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [transactions, setTransactions] = useState<
    { id: string; type: string; tradeType: string; amount: number; kwh: number; timestamp: string; status: string }[]
  >([])

  const loadData = useCallback(async () => {
    const [balanceData, tradesData] = await Promise.all([fetchWalletBalance(), fetchTrades()])
    if (balanceData !== null) setBalance(balanceData)
    if (tradesData) {
      setTransactions(
        tradesData.map((trade: Trade) => ({
          id: trade.id,
          type: trade.type === "Buy" ? "Energy Purchase" : "Energy Sale",
          tradeType: trade.type,
          amount: trade.type === "Buy" ? -trade.total : trade.total,
          kwh: trade.kwh,
          timestamp: trade.timestamp,
          status: trade.status,
        }))
      )
    }
    setDataLoaded(true)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const balanceHistory = generateBalanceHistory(balance)
  const totalBought = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
  const totalSold = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const totalKwhBought = transactions.filter(t => t.tradeType === "Buy").reduce((s, t) => s + t.kwh, 0)
  const totalKwhSold = transactions.filter(t => t.tradeType === "Sell").reduce((s, t) => s + t.kwh, 0)

  function handleCopy() {
    navigator.clipboard.writeText("0x71C7656EC7ab88b098defB751B7401B5f6d8976F")
    setCopied(true)
    toast.success("Address copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Top Row: Balance + Chart ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2 stat-card stat-card-emerald relative overflow-hidden">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total Balance</p>
          {dataLoaded ? (
            <h2 className="text-3xl font-bold text-slate-900 number-loaded">
              <AnimatedNumber value={balance} /> <span className="text-lg font-normal text-slate-400">ETK</span>
            </h2>
          ) : (
            <div className="skeleton h-9 w-40 mt-1" />
          )}
          <div className="flex items-center mt-2 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
            <TrendingUp className="w-3 h-3 mr-1" /> +12.5% this month
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button className="bg-slate-900 hover:bg-slate-800 text-white transition-colors p-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Deposit
            </button>
            <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors p-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium">
              <Upload className="w-4 h-4" /> Withdraw
            </button>
          </div>

          <div className="absolute right-0 bottom-0 p-4 opacity-5">
            <Zap className="w-24 h-24" />
          </div>
        </Card>

        <Card className="lg:col-span-3 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">Balance History (15 days)</h3>
            <Badge color="green">Live</Badge>
          </div>
          <div className="flex-1 min-h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={balanceHistory}>
                <defs>
                  <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  interval="preserveStartEnd"
                />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  formatter={(value: number) => [`${value.toFixed(2)} ETK`, "Balance"]}
                />
                <Area type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={2} fill="url(#balGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ── Middle Row: Portfolio Stats + Address ──── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="stat-card stat-card-blue animate-slide-up animate-slide-up-delay-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total Spent</p>
          {dataLoaded ? (
            <h3 className="text-xl font-bold text-slate-900">{formatCurrency(totalBought)} <span className="text-sm font-normal text-slate-400">ETK</span></h3>
          ) : <div className="skeleton h-6 w-20 mt-1" />}
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <ArrowDownRight className="w-3 h-3 text-blue-500" /> {totalKwhBought.toFixed(1)} kWh purchased
          </p>
        </Card>

        <Card className="stat-card stat-card-emerald animate-slide-up animate-slide-up-delay-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total Earned</p>
          {dataLoaded ? (
            <h3 className="text-xl font-bold text-emerald-600">+{formatCurrency(totalSold)} <span className="text-sm font-normal text-slate-400">ETK</span></h3>
          ) : <div className="skeleton h-6 w-20 mt-1" />}
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3 text-emerald-500" /> {totalKwhSold.toFixed(1)} kWh sold
          </p>
        </Card>

        <Card className="stat-card stat-card-orange animate-slide-up animate-slide-up-delay-3">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total Trades</p>
          {dataLoaded ? (
            <h3 className="text-xl font-bold text-slate-900">{transactions.length}</h3>
          ) : <div className="skeleton h-6 w-12 mt-1" />}
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-500" /> All completed
          </p>
        </Card>

        <Card className="animate-slide-up animate-slide-up-delay-3">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Wallet Address</p>
          <code className="text-[11px] text-slate-600 font-mono block truncate mt-1">
            0x71C7656EC7ab88b098defB751B7401B5f6d8976F
          </code>
          <button
            onClick={handleCopy}
            className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy Address"}
          </button>
        </Card>
      </div>

      {/* ── Transaction History ──────────────────── */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-slate-900">Transaction History</h3>
          <span className="text-xs text-slate-400">{transactions.length} transactions</span>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          <div className="space-y-1">
            {!dataLoaded ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div className="skeleton w-9 h-9 rounded-full" />
                    <div>
                      <div className="skeleton h-4 w-24 mb-1" />
                      <div className="skeleton h-3 w-16" />
                    </div>
                  </div>
                  <div className="skeleton h-5 w-20" />
                </div>
              ))
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${
                        tx.amount > 0
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {tx.amount > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{tx.type}</p>
                      <p className="text-xs text-slate-500">{tx.timestamp} · {tx.kwh} kWh</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span
                      className={`text-sm font-semibold ${
                        tx.amount > 0 ? "text-emerald-600" : "text-slate-900"
                      }`}
                    >
                      {tx.amount > 0 ? "+" : ""}{formatCurrency(tx.amount)} ETK
                    </span>
                    <Badge color={tx.status === "Completed" ? "green" : "gray"}>
                      {tx.status === "Completed" ? "✓" : "…"}
                    </Badge>
                  </div>
                </div>
              ))
            )}
            {dataLoaded && transactions.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-8">No transactions yet</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
