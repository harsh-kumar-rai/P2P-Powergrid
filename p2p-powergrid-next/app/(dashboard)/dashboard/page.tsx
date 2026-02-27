"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Zap, ArrowUpRight, ArrowDownRight, Sun, Battery, Activity, Factory, FileCode, X, CheckCircle } from "lucide-react"
import { Card, Button, Badge } from "@/components/ui"
import { fetchTrades, fetchWalletBalance, fetchGridStats, fetchInsight, resetDemo } from "@/lib/api"
import { generatePriceHistory, formatCurrency } from "@/lib/utils"
import type { Trade, GridStats, MarketDataPoint } from "@/lib/types"
import toast from "react-hot-toast"

// Animated count-up number component
function AnimatedNumber({ value, decimals = 1, duration = 800 }: { value: number; decimals?: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const prevValue = useRef(0)

  useEffect(() => {
    const start = prevValue.current
    const diff = value - start
    if (diff === 0) return
    const startTime = performance.now()
    let raf: number

    function animate(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(start + diff * eased)
      if (progress < 1) {
        raf = requestAnimationFrame(animate)
      } else {
        prevValue.current = value
      }
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return <>{display.toFixed(decimals)}</>
}

const SMART_CONTRACT_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract EnergyTrading {
    address public owner;
    IERC20 public energyToken;

    struct Trade {
        address buyer;
        address seller;
        uint256 energyAmount;
        uint256 price;
        bool settled;
    }

    Trade[] public trades;

    event TradeInitiated(
        address indexed buyer,
        address indexed seller,
        uint256 energyAmount,
        uint256 price
    );
    event TradeSettled(uint256 tradeId);

    constructor(address _energyToken) {
        owner = msg.sender;
        energyToken = IERC20(_energyToken);
    }

    function initiateTrade(
        address seller,
        uint256 energyAmount,
        uint256 price
    ) public {
        require(msg.sender != seller, "Cannot trade with oneself");
        require(energyAmount > 0, "Energy amount must be > 0");

        trades.push(Trade({
            buyer: msg.sender,
            seller: seller,
            energyAmount: energyAmount,
            price: price,
            settled: false
        }));

        emit TradeInitiated(msg.sender, seller, energyAmount, price);
    }

    function settleTrade(uint256 tradeId) public payable {
        require(tradeId < trades.length, "Invalid trade ID");
        Trade storage trade = trades[tradeId];
        require(!trade.settled, "Trade already settled");

        uint256 totalCost = trade.energyAmount * trade.price;
        require(msg.value == totalCost, "Payment must equal totalCost");

        require(
            energyToken.transferFrom(trade.buyer, trade.seller, trade.energyAmount),
            "Energy transfer failed"
        );

        (bool success, ) = payable(trade.seller).call{value: totalCost}("");
        require(success, "Payment to seller failed");

        trade.settled = true;
        emit TradeSettled(tradeId);
    }
}`

export default function DashboardPage() {
  const router = useRouter()
  const [trades, setTrades] = useState<Trade[]>([])
  const [balance, setBalance] = useState(0)
  const [insight, setInsight] = useState("")
  const [insightLoading, setInsightLoading] = useState(true)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showContract, setShowContract] = useState(false)
  const [currentPrice, setCurrentPrice] = useState(0.142)
  const [priceHistory, setPriceHistory] = useState<MarketDataPoint[]>(generatePriceHistory())
  const [stats, setStats] = useState<GridStats>({
    gridConsumption: 42.8,
    netStorage: 18.2,
    generationOutput: 1420.5,
    netExport: 850.2,
  })

  const role = typeof window !== "undefined" ? localStorage.getItem("user_role") || "CONSUMER" : "CONSUMER"

  const loadData = useCallback(async () => {
    const [balanceData, tradesData, statsData] = await Promise.all([
      fetchWalletBalance(),
      fetchTrades(),
      fetchGridStats(),
    ])

    if (balanceData !== null) setBalance(balanceData)
    if (tradesData) setTrades(tradesData)
    if (statsData) setStats(statsData)
    setDataLoaded(true)
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 3000)
    return () => clearInterval(interval)
  }, [loadData])

  useEffect(() => {
    fetchInsight(currentPrice, 68, 42).then((text) => {
      setInsight(text)
      setInsightLoading(false)
    })
  }, [currentPrice])

  async function handleReset() {
    if (!confirm("Reset all demo data?")) return
    const promise = resetDemo()
    toast.promise(promise, {
      loading: "Resetting...",
      success: "Demo reset successfully!",
      error: "Reset failed",
    })
    await promise
    setTimeout(() => window.location.reload(), 800)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div />
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push("/wallet")} icon={Activity}>
            Wallet
          </Button>
          <Button onClick={() => router.push("/market")} icon={Zap}>
            Trade Energy
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="stat-card stat-card-emerald flex items-center justify-between relative overflow-hidden animate-slide-up animate-slide-up-delay-1">
          <div className="z-10">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
              Wallet Balance
            </p>
            {dataLoaded ? (
              <h3 className="text-2xl font-bold text-slate-900 number-loaded">
                <AnimatedNumber value={balance} decimals={2} /> <span className="text-sm font-normal text-slate-400">ETK</span>
              </h3>
            ) : (
              <div className="skeleton h-7 w-32 mt-1" />
            )}
            <div className="flex items-center mt-2 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
              <ArrowUpRight className="w-3 h-3 mr-1" /> +12.5%
            </div>
          </div>
          <div className="absolute right-0 bottom-0 p-4 opacity-5">
            <Zap className="w-24 h-24" />
          </div>
        </Card>

        <Card className="stat-card stat-card-orange animate-slide-up animate-slide-up-delay-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            {role === "INDUSTRY" ? "Generation Output" : "Grid Consumption"}
          </p>
          {dataLoaded ? (
            <h3 className="text-2xl font-bold text-slate-900 number-loaded">
              <AnimatedNumber value={role === "INDUSTRY" ? stats.generationOutput : stats.gridConsumption} />{" "}
              <span className="text-sm font-normal text-slate-400">kWh</span>
            </h3>
          ) : (
            <div className="skeleton h-7 w-24 mt-1" />
          )}
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            {role === "INDUSTRY" ? (
              <Factory className="w-4 h-4 text-orange-400" />
            ) : (
              <Sun className="w-4 h-4 text-orange-400" />
            )}
            <span>{role === "INDUSTRY" ? "Unit B Turbines" : "Solar Array A"}</span>
          </div>
        </Card>

        <Card className="stat-card stat-card-blue animate-slide-up animate-slide-up-delay-3">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            Net {role === "INDUSTRY" ? "Export" : "Storage"}
          </p>
          {dataLoaded ? (
            <h3 className="text-2xl font-bold text-slate-900 number-loaded">
              <AnimatedNumber value={role === "INDUSTRY" ? stats.netExport : stats.netStorage} />{" "}
              <span className="text-sm font-normal text-slate-400">kWh</span>
            </h3>
          ) : (
            <div className="skeleton h-7 w-20 mt-1" />
          )}
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <Battery className="w-4 h-4 text-emerald-500" />
            <span>{role === "INDUSTRY" ? "Grid Injection" : "Storage at 85%"}</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-[350px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-medium text-slate-500">Live Market Price</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900">{currentPrice.toFixed(3)}</span>
                  <span className="text-sm text-slate-400">ETK/kWh</span>
                </div>
              </div>
              <Badge color="green">Live</Badge>
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={priceHistory}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    dy={10}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    domain={["dataMin - 0.01", "dataMax + 0.01"]}
                    tickFormatter={(v: number) => v.toFixed(2)}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value: number) => [`${value} ETK`, "Price"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPrice)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-emerald-400 uppercase tracking-wide">
                  Grid Intelligence
                </span>
              </div>
              {insightLoading ? (
                <div className="space-y-2">
                  <div className="h-3 bg-white/10 rounded-full w-full animate-pulse" />
                  <div className="h-3 bg-white/10 rounded-full w-4/5 animate-pulse" style={{ animationDelay: '0.15s' }} />
                  <div className="h-3 bg-white/10 rounded-full w-3/5 animate-pulse" style={{ animationDelay: '0.3s' }} />
                </div>
              ) : (
                <p className="text-sm font-light leading-relaxed opacity-90 animate-fade-in">&quot;{insight}&quot;</p>
              )}
            </div>
            <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute left-0 bottom-0 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="h-full">
            <h3 className="text-sm font-medium text-slate-900 mb-5">Recent Activity</h3>
            <div className="max-h-[380px] overflow-y-auto space-y-1 pr-1">
              {!dataLoaded ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <div className="skeleton w-8 h-8 rounded-full" />
                      <div>
                        <div className="skeleton h-4 w-20 mb-1" />
                        <div className="skeleton h-3 w-14" />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="skeleton h-4 w-16 mb-1 ml-auto" />
                      <div className="skeleton h-3 w-12 ml-auto" />
                    </div>
                  </div>
                ))
              ) : (
                trades.map((trade, index) => (
                <div
                  key={trade.id}
                  className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-all duration-200 cursor-default"
                  style={{ animationDelay: `${index * 0.08}s` }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${
                        trade.type === "Buy"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      {trade.type === "Buy" ? (
                        <ArrowDownRight className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{trade.type} Energy</p>
                      <p className="text-xs text-slate-500">{trade.timestamp}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-medium ${
                        trade.type === "Sell" ? "text-emerald-600" : "text-slate-900"
                      }`}
                    >
                      {trade.type === "Sell" ? "+" : "-"}
                      {formatCurrency(trade.total)} ETK
                    </p>
                    <p className="text-xs text-slate-400">{trade.kwh} kWh</p>
                  </div>
                </div>
              )))
              }
              {dataLoaded && trades.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-8">No trades yet</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl p-6 text-slate-400 font-mono text-xs overflow-hidden shadow-2xl border border-slate-800 relative">
        <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-4">
            <span className="text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Live Blockchain Ledger
            </span>
            <Badge color="blue">Mainnet Beta</Badge>
          </div>
          <div className="flex items-center gap-4">
            <span>Block #18,242,910</span>
            <button
              onClick={() => setShowContract(true)}
              className="flex items-center gap-1.5 text-emerald-500 hover:text-emerald-400 underline decoration-dotted underline-offset-4 transition-colors"
            >
              View Smart Contract
              <span className="no-underline px-1.5 py-0.5 text-[9px] font-bold bg-emerald-500/15 text-emerald-400 rounded-md border border-emerald-500/30">
                Compiled ✓
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-2 text-[10px] uppercase tracking-wider text-slate-600 font-bold px-2">
          <div>Timestamp</div>
          <div>Action</div>
          <div>Transaction Hash</div>
          <div className="text-right">Status</div>
        </div>

        <div className="space-y-1 max-h-48 overflow-y-auto">
          {trades.slice(0, 8).map((trade) => (
            <div
              key={trade.id}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center hover:bg-slate-800/50 p-2 rounded transition-colors border-b border-slate-800/30 last:border-0"
            >
              <span className="text-slate-500">{trade.timestamp}</span>
              <span className={trade.type === "Buy" ? "text-emerald-400" : "text-blue-400"}>
                {trade.type.toUpperCase()} {trade.kwh}kWh @ {trade.pricePerKwh} ETK
              </span>
              <span className="text-slate-600 truncate font-mono text-[10px]">
                {trade.txHash || "0x7f...3a"}
              </span>
              <span className="text-emerald-600 text-right flex items-center justify-end gap-1">
                Verified <CheckCircle className="w-3 h-3" />
              </span>
            </div>
          ))}
          {trades.length === 0 && (
            <div className="text-center italic opacity-50 py-4">Waiting for next block...</div>
          )}
        </div>
      </div>

      {showContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-gray-500 border-2 border-gray-400 rounded-2xl w-full max-w-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-600 bg-gray-800">
              <div className="flex items-center gap-3">
                <FileCode className="w-5 h-5 text-emerald-500" />
                <h3 className="text-slate-200 font-semibold font-mono">EnergyTrading.sol</h3>
              </div>
              <button
                onClick={() => setShowContract(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-0 overflow-x-auto overflow-y-auto max-h-[60vh] bg-gray-500">
              <pre className="text-xs font-mono text-slate-300 p-6 leading-relaxed">
                {SMART_CONTRACT_SOURCE}
              </pre>
            </div>
            <div className="p-4 border-t border-gray-600 bg-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] text-gray-300 flex-wrap">
                <span className="px-2 py-0.5 bg-gray-700 rounded text-gray-200">Solidity ^0.8.21</span>
                <span className="px-2 py-0.5 bg-gray-700 rounded text-gray-200">OpenZeppelin ERC20</span>
                <span className="px-2 py-0.5 bg-emerald-800/60 border border-emerald-600/40 rounded text-emerald-300 font-semibold">✓ Compiled · Hardhat v2</span>
                <span className="px-2 py-0.5 bg-emerald-800/60 border border-emerald-600/40 rounded text-emerald-300 font-semibold">✓ 11 Tests Passing</span>
              </div>
              <button
                onClick={() => setShowContract(false)}
                className="px-4 py-2 text-xs font-medium text-white bg-gray-700 hover:bg-gray-600 rounded-xl border border-gray-500 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
