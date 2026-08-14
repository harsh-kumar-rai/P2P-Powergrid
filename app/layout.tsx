import type { Metadata } from "next"
import { Toaster } from "react-hot-toast"
import "./globals.css"

export const metadata: Metadata = {
  title: "P2P PowerGrid — Decentralized Energy Trading",
  description: "A peer-to-peer energy trading platform enabling cross-border renewable energy exchange with blockchain transparency and AI-driven market insights.",
  keywords: ["P2P energy trading", "blockchain", "smart grid", "renewable energy", "prosumer"],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <Toaster position="top-center" reverseOrder={false} />
        {children}
      </body>
    </html>
  )
}
