"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Zap, ArrowRight, Activity, Wallet, UploadCloud, Factory, Check } from "lucide-react"
import toast from "react-hot-toast"
import { Button, Input, Card } from "@/components/ui"
import { UserRole } from "@/lib/types"
import * as api from "@/lib/api"

export default function LoginPage() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(true)
  const [role, setRole] = useState<string>(UserRole.CONSUMER)
  const [method, setMethod] = useState<"email" | "wallet">("email")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const data = isSignUp
        ? await api.signup(email, password, role)
        : await api.login(email, password)

      api.setToken(data.token)
      toast.success(isSignUp ? "Account created successfully!" : "Welcome back!")
      router.push("/dashboard")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  function handleWalletConnect(walletName: string) {
    setIsLoading(true)
    toast.loading(`Connecting ${walletName}...`, { duration: 1500 })
    setTimeout(() => {
      setIsLoading(false)
      toast.error("Wallet connection requires a deployed smart contract")
    }, 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900 text-white mb-4 shadow-lg shadow-slate-200">
            <Zap className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">P2P PowerGrid</h1>
          <p className="text-slate-500 mt-2 text-sm">Decentralized Energy Trading Platform</p>
        </div>

        <Card className="shadow-xl shadow-slate-200/50 border-slate-100 overflow-hidden">
          <div className="flex p-1 mb-6 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                isSignUp ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                !isSignUp ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Log In
            </button>
          </div>

          {isSignUp && (
            <div className="p-1 mb-6 bg-slate-100/50 rounded-xl border border-slate-200 flex animate-fade-in">
              <button
                type="button"
                onClick={() => setRole(UserRole.CONSUMER)}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                  role === UserRole.CONSUMER
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Consumer
              </button>
              <button
                type="button"
                onClick={() => setRole(UserRole.INDUSTRY)}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                  role === UserRole.INDUSTRY
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Factory className="w-3.5 h-3.5" />
                Industry
              </button>
            </div>
          )}

          <div className="flex border-b border-slate-100 mb-6">
            <button
              onClick={() => setMethod("email")}
              className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 ${
                method === "email"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Email
            </button>
            <button
              onClick={() => setMethod("wallet")}
              className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 ${
                method === "wallet"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Web3 Wallet
            </button>
          </div>

          {method === "email" ? (
            <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in" autoComplete="off">
              <div className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="off"
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />

                {isSignUp && (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                      Identity Verification (PAN/ID)
                    </label>
                    <label
                      className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                        file
                          ? "border-emerald-200 bg-emerald-50/50"
                          : "border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {file ? (
                          <>
                            <Check className="w-6 h-6 text-emerald-500 mb-1" />
                            <p className="text-xs text-emerald-600 font-medium truncate max-w-[200px]">
                              {file.name}
                            </p>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                            <p className="text-xs text-slate-500">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">PDF, PNG, JPG (Max 5MB)</p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        accept=".pdf,.png,.jpg,.jpeg"
                      />
                    </label>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full h-11" isLoading={isLoading} icon={ArrowRight}>
                {isSignUp
                  ? role === UserRole.INDUSTRY
                    ? "Create Industrial Account"
                    : "Create Consumer Account"
                  : "Log In"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Wallet className="w-8 h-8 text-slate-900" />
                </div>
                <h3 className="text-sm font-medium text-slate-900">Connect your wallet</h3>
                <p className="text-xs text-slate-500 mt-1">Secure authentication via blockchain</p>
              </div>

              {[
                { name: "MetaMask", color: "orange", letter: "M" },
                { name: "WalletConnect", color: "blue", letter: "W" },
                { name: "Phantom", color: "purple", letter: "P" },
              ].map((wallet) => (
                <button
                  key={wallet.name}
                  type="button"
                  onClick={() => handleWalletConnect(wallet.name.toLowerCase())}
                  disabled={isLoading}
                  className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full bg-${wallet.color}-100 flex items-center justify-center`}>
                      <span className={`text-${wallet.color}-600 font-bold text-xs`}>{wallet.letter}</span>
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                      {wallet.name}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                </button>
              ))}

              {isLoading && (
                <p className="text-center text-xs text-emerald-600 font-medium animate-pulse mt-4">
                  Requesting signature...
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
