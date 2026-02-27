"use client"

import { useState, useEffect } from "react"
import { Server, ShieldCheck, Activity, Zap } from "lucide-react"

export function NetworkStatus() {
  const [latency, setLatency] = useState(14)
  const [uptime, setUptime] = useState(98.2)

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency((prev) => Math.max(10, Math.min(25, prev + (Math.random() > 0.5 ? 1 : -1))))
      setUptime((prev) => Math.max(98.0, Math.min(99.9, prev + (Math.random() - 0.5) * 0.1)))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full px-2">
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Grid Status
          </span>
          <span className="flex items-center gap-1.5 bg-emerald-100/50 px-2 py-1 rounded-full border border-emerald-100">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-semibold text-emerald-700">Online</span>
          </span>
        </div>

        <div className="space-y-3">
          <StatusRow icon={Server} label="Industry Nodes" value={`${uptime.toFixed(1)}%`} />
          <StatusRow icon={ShieldCheck} label="Smart Contracts" value="Verified" />
          <StatusRow icon={Activity} label="Grid Frequency" value="50.0Hz" />
          <StatusRow icon={Zap} label="Token Bridge" value="Synced" />
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200/60">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>Latency</span>
            <span className="font-mono">{latency}ms</span>
          </div>
          <div className="w-full bg-slate-200 h-0.5 mt-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${(latency / 50) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-2.5">
        <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
        <span className="text-xs font-medium text-slate-600">{label}</span>
      </div>
      <span className="text-[10px] text-slate-900 font-mono font-medium">{value}</span>
    </div>
  )
}
