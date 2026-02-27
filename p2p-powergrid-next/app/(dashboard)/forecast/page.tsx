"use client"

import { useState, useEffect } from "react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Brain, TrendingUp, Zap, Battery, Sun, CheckCircle } from "lucide-react"
import { Card, Badge } from "@/components/ui"
import { fetchForecast } from "@/lib/api"
import type { ForecastPoint } from "@/lib/types"

interface ModelMetrics {
  r2_demand: number
  rmse_demand: number
  mae_demand: number
  r2_price: number
  rmse_price: number
  mape_price: number
}

interface ModelInfo {
  name: string
  algorithm: string
  trainedAt: string
  trainingRecords: number
  features: string[]
  metrics: ModelMetrics
  crossValidation: string
}

export default function ForecastPage() {
  const [data, setData] = useState<ForecastPoint[]>([])
  const [model, setModel] = useState<ModelInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchForecast().then((res) => {
      if (res) {
        setData(res.predictions)
        setModel(res.model)
      }
      setLoading(false)
    })
  }, [])

  const peakDemand = data.reduce((max, d) => Math.max(max, d.demand), 0)
  const peakSupply = data.reduce((max, d) => Math.max(max, d.supply), 0)
  const avgPrice = data.length > 0 ? data.reduce((sum, d) => sum + d.price, 0) / data.length : 0
  const optimalBuyHour = data.reduce((best, d, _, arr) =>
    d.price < (arr[Number(best)] || { price: Infinity }).price ? String(data.indexOf(d)) : best,
    "0"
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Brain className="w-5 h-5 text-emerald-500" />
            Energy Demand Forecast
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            ML-powered 24-hour predictions using {model?.name || "LightGBM"}
          </p>
        </div>
        <Badge color="blue">{model?.name || "LightGBM Model"}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Peak Demand</p>
            <p className="text-lg font-bold text-slate-900">{peakDemand} kWh</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
            <Sun className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Peak Supply</p>
            <p className="text-lg font-bold text-slate-900">{peakSupply} kWh</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Avg Price</p>
            <p className="text-lg font-bold text-slate-900">{avgPrice.toFixed(3)} ETK</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
            <Battery className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Best Buy</p>
            <p className="text-lg font-bold text-slate-900">
              {data[Number(optimalBuyHour)]?.hour || "—"}
            </p>
          </div>
        </Card>
      </div>

      <Card className="h-[380px] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-900">Demand vs Supply (24h)</h3>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-1.5 bg-red-400 rounded-full" /> Demand
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-1.5 bg-emerald-400 rounded-full" /> Supply
            </span>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="hour"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                interval={2}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(v: number) => `${v}`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="demand" fill="#f87171" radius={[4, 4, 0, 0]} />
              <Bar dataKey="supply" fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="h-[320px] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-900">Predicted Price Curve (24h)</h3>
          <Badge color="green">Forecast</Badge>
        </div>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="hour"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                interval={2}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                domain={["dataMin - 0.02", "dataMax + 0.02"]}
                tickFormatter={(v: number) => v.toFixed(2)}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`${value.toFixed(3)} ETK`, "Price"]}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#8b5cf6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorForecast)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-medium text-purple-400 uppercase tracking-wide">
              Model Details
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm mb-6">
            <div>
              <p className="text-slate-400 text-xs mb-1">Algorithm</p>
              <p className="font-medium">{model?.algorithm || "LightGBM"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Training Data</p>
              <p className="font-medium">
                {model ? `${(model.trainingRecords / 1_000_000).toFixed(1)}M records` : "—"}, hourly grid telemetry
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Validation</p>
              <p className="font-medium">{model?.crossValidation || "—"}</p>
            </div>
          </div>

          {model && (
            <div className="border-t border-slate-800 pt-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
                Accuracy Metrics
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 mb-1">Demand R²</p>
                  <p className="text-lg font-bold text-emerald-400 flex items-center gap-1">
                    {model.metrics.r2_demand}
                    <CheckCircle className="w-3.5 h-3.5" />
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 mb-1">Demand RMSE</p>
                  <p className="text-lg font-bold text-white">{model.metrics.rmse_demand} kWh</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 mb-1">Demand MAE</p>
                  <p className="text-lg font-bold text-white">{model.metrics.mae_demand} kWh</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 mb-1">Price R²</p>
                  <p className="text-lg font-bold text-emerald-400 flex items-center gap-1">
                    {model.metrics.r2_price}
                    <CheckCircle className="w-3.5 h-3.5" />
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 mb-1">Price RMSE</p>
                  <p className="text-lg font-bold text-white">{model.metrics.rmse_price} ETK</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 mb-1">Price MAPE</p>
                  <p className="text-lg font-bold text-white">{model.metrics.mape_price}%</p>
                </div>
              </div>
            </div>
          )}

          {model && (
            <div className="border-t border-slate-800 pt-4 mt-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                Feature Set ({model.features.length} features)
              </p>
              <div className="flex flex-wrap gap-2">
                {model.features.map((f) => (
                  <span key={f} className="px-2 py-1 bg-slate-800 rounded-lg text-[10px] text-slate-300 font-mono">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      </div>
    </div>
  )
}
