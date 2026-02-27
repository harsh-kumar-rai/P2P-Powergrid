"use client"

import { useState, useEffect } from "react"
import { ArrowLeftRight, Zap, AlertCircle } from "lucide-react"
import { Card, Button, Input, Badge } from "@/components/ui"
import { TradeType } from "@/lib/types"
import { executeTrade, fetchMarketPrice } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import toast from "react-hot-toast"
import confetti from "canvas-confetti"

export default function MarketPage() {
  const [activeTab, setActiveTab] = useState<string>(TradeType.BUY)
  const [amount, setAmount] = useState("")
  const [currentPrice, setCurrentPrice] = useState(0.142)
  const [showSignature, setShowSignature] = useState(false)
  const [isSigning, setIsSigning] = useState(false)

  useEffect(() => {
    fetchMarketPrice().then((p) => p && setCurrentPrice(p))
    const interval = setInterval(async () => {
      const p = await fetchMarketPrice()
      if (p) setCurrentPrice(p)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const estimatedTotal = amount ? (parseFloat(amount) * currentPrice).toFixed(2) : "0.00"

  function handleTradeSubmit(e: React.FormEvent) {
    e.preventDefault()
    setShowSignature(true)
  }

  async function confirmSignature() {
    setIsSigning(true)
    await new Promise((r) => setTimeout(r, 1500))

    const toastId = toast.loading("Broadcasting transaction...")
    try {
      await executeTrade(activeTab, parseFloat(amount), currentPrice)
      setShowSignature(false)
      setIsSigning(false)
      toast.success(`Transaction Confirmed: ${activeTab} ${amount} kWh`, { id: toastId })
      setAmount("")
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
    } catch (err: unknown) {
      setIsSigning(false)
      setShowSignature(false)
      const message = err instanceof Error ? err.message : "Trade failed"
      toast.error(message, { id: toastId })
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in relative">
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold text-slate-900">Energy Marketplace</h2>
        <p className="text-sm text-slate-500 mt-1">Real-time peer-to-peer execution</p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab(TradeType.BUY)}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              activeTab === TradeType.BUY
                ? "bg-white text-slate-900 border-b-2 border-slate-900"
                : "bg-slate-50 text-slate-500 hover:text-slate-700"
            }`}
          >
            Buy Energy
          </button>
          <button
            onClick={() => setActiveTab(TradeType.SELL)}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              activeTab === TradeType.SELL
                ? "bg-white text-slate-900 border-b-2 border-slate-900"
                : "bg-slate-50 text-slate-500 hover:text-slate-700"
            }`}
          >
            Sell Energy
          </button>
        </div>

        <div className="p-8">
          <form onSubmit={handleTradeSubmit} className="space-y-8">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-sm font-medium text-slate-500">Current Market Price</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900">{currentPrice.toFixed(3)} ETK</span>
                <span className="text-xs text-slate-400">/ kWh</span>
              </div>
            </div>

            <Input
              label={activeTab === TradeType.BUY ? "Energy Needed" : "Energy Available"}
              type="number"
              placeholder="0.00"
              suffix="kWh"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.1"
              autoFocus
            />

            <div className="space-y-3 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-900">{estimatedTotal} ETK</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Network Fee (0.5%)</span>
                <span className="font-medium text-slate-900">
                  {(parseFloat(estimatedTotal) * 0.005).toFixed(3)} ETK
                </span>
              </div>
              <div className="border-t border-slate-100 my-2" />
              <div className="flex justify-between items-end">
                <span className="text-sm font-medium text-slate-900">Estimated Total</span>
                <span
                  className={`text-2xl font-bold ${
                    activeTab === TradeType.SELL ? "text-emerald-600" : "text-slate-900"
                  }`}
                >
                  {activeTab === TradeType.SELL ? "+" : "-"}
                  {estimatedTotal} ETK
                </span>
              </div>
            </div>

            <Button
              type="submit"
              className={`w-full h-12 text-base ${
                activeTab === TradeType.SELL ? "bg-emerald-600 hover:bg-emerald-700" : ""
              }`}
              disabled={!amount || parseFloat(amount) <= 0}
            >
              {activeTab === TradeType.BUY ? "Place Buy Order" : "Place Sell Order"}
            </Button>
          </form>
        </div>
      </Card>

      <div className="flex gap-4 items-start p-4 bg-blue-50 text-blue-800 rounded-xl text-sm">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <p className="opacity-90">
          Smart contracts automatically execute trades when matching orders are found. Funds are held
          in escrow until energy delivery is verified by the smart meter oracle.
        </p>
      </div>

      {showSignature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-100 rounded-2xl w-full max-w-sm shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden border border-slate-300">
            <div className="bg-slate-200 p-4 border-b border-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-orange-600 font-bold text-xs">M</span>
                </div>
                <span className="text-sm font-semibold text-slate-700">MetaMask</span>
              </div>
              <div className="text-xs text-slate-500 bg-slate-300 px-2 py-0.5 rounded-full">
                Goerli Testnet
              </div>
            </div>

            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-slate-200 shadow-lg">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Signature Request</h3>
              <p className="text-xs text-slate-500 mb-6 break-all px-4">
                0x71C7656EC7ab88b098defB751B7401B5f6d8976F
              </p>

              <div className="bg-white rounded-xl p-4 text-left mb-6 border border-slate-200 shadow-sm">
                <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-2">
                  Message
                </div>
                <div className="font-mono text-xs text-slate-600 space-y-1">
                  <p>Action: {activeTab.toUpperCase()}_ENERGY</p>
                  <p>Amount: {amount} kWh</p>
                  <p>Price: {currentPrice} ETK/kWh</p>
                  <p>Nonce: {Math.floor(Math.random() * 100000)}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSignature(false)}
                  className="flex-1 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={confirmSignature}
                  disabled={isSigning}
                  className="flex-1 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                >
                  {isSigning ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing...
                    </>
                  ) : (
                    "Sign"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
