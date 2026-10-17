'use client'

import { useEffect, useRef, useState } from 'react'

export function useVoiceSyncedText(text: string, active: boolean) {
  const [displayed, setDisplayed] = useState(text)
  const lastRatioRef = useRef(0)

  useEffect(() => {
    if (!text.trim()) {
      setDisplayed('')
      lastRatioRef.current = 0
      return
    }

    if (!active) {
      setDisplayed(text)
      lastRatioRef.current = 1
      return
    }

    setDisplayed('')
    lastRatioRef.current = 0

    let fallbackIndex = 0
    const fallback = window.setInterval(() => {
      if (lastRatioRef.current > 0.02) return
      fallbackIndex += 1
      setDisplayed(text.slice(0, fallbackIndex))
      if (fallbackIndex >= text.length) window.clearInterval(fallback)
    }, Math.max(18, Math.min(42, Math.round(2400 / Math.max(text.length, 1)))))

    return () => {
      window.clearInterval(fallback)
    }
  }, [active, text])

  return displayed
}
