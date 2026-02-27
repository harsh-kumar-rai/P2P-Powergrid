"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState, useRef } from "react"

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)
  const [displayChildren, setDisplayChildren] = useState(children)
  const prevPath = useRef(pathname)

  useEffect(() => {
    // Same path — no transition needed (initial load or refresh)
    if (prevPath.current === pathname) {
      setDisplayChildren(children)
      return
    }

    // Route changed — start exit animation
    setIsVisible(false)

    const timeout = setTimeout(() => {
      // Swap content and trigger enter animation
      setDisplayChildren(children)
      prevPath.current = pathname
      setIsVisible(true)
    }, 150) // exit animation duration

    return () => clearTimeout(timeout)
  }, [pathname, children])

  return (
    <div
      className="page-transition"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 200ms ease, transform 200ms ease",
      }}
    >
      {displayChildren}
    </div>
  )
}
