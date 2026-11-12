'use client'

import { useEffect, useState } from 'react'
import { downloadLatencyReport, isTelemetryRequested, lessonTurnTelemetry } from '@/lib/lesson-turn-telemetry'

/**
 * Supervised-test only: appears when the page address has ?latency=1, and offers the anonymous timing report as a
 * file. Renders nothing for children. The report holds times and labels, never audio, words, PINs or names.
 */
export function LatencyReportButton() {
  const [visible, setVisible] = useState(false)
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!isTelemetryRequested(window.location.search)) return
    setVisible(true)
    const timer = window.setInterval(() => setCount(lessonTurnTelemetry.report().turns.length), 1000)
    return () => window.clearInterval(timer)
  }, [])
  if (!visible) return null
  return (
    <button
      type="button"
      onClick={() => { downloadLatencyReport() }}
      style={{ position: 'fixed', right: 8, bottom: 8, zIndex: 50, font: '12px system-ui', padding: '6px 10px', borderRadius: 8, border: '1px solid #888', background: '#fff', color: '#222' }}
    >
      Latency report ({count} turns)
    </button>
  )
}
