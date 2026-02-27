import Link from "next/link"
import { Zap, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200">
          <Zap className="w-10 h-10 text-emerald-400" />
        </div>

        <h1 className="text-6xl font-bold text-slate-900 mb-2">404</h1>
        <h2 className="text-lg font-semibold text-slate-700 mb-3">Page Not Found</h2>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          The energy grid node you&apos;re looking for doesn&apos;t exist or has been
          decommissioned from the network.
        </p>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <p className="mt-8 text-xs text-slate-400">
          P2P PowerGrid • Decentralized Energy Trading
        </p>
      </div>
    </div>
  )
}
