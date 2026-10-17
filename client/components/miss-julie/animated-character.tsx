'use client'

import { useState } from 'react'
import { voiceService } from '@/services/voice-service'

export function AnimatedMissJulie({
  message = 'Ready for your next adventure?',
}: {
  message?: string
}) {
  const [mood, setMood] = useState<'idle' | 'excited' | 'talking'>('idle')
  const [busy, setBusy] = useState(false)

  async function greet() {
    if (busy || !message.trim()) return

    if (mood === 'talking') {
      voiceService.stop()
      setMood('idle')
      setBusy(false)
      return
    }

    setBusy(true)
    setMood('talking')

    const turnId = `animated-julie:${message.trim().toLowerCase()}`
    const result = await voiceService.speak(
      message,
      (state) => {
        if (state === 'speaking') setMood('talking')
        if (state === 'idle') setMood('excited')
        if (state === 'error') setMood('idle')
      },
      turnId,
    )

    setBusy(false)
    setMood(result === 'spoken' ? 'excited' : 'idle')
    window.setTimeout(() => setMood('idle'), 1200)
  }

  return (
    <button
      className={`miss-julie-character miss-julie-${mood}`}
      type="button"
      onClick={() => void greet()}
      aria-label={mood === 'talking' ? 'Stop Miss Julie' : 'Talk to Miss Julie'}
      aria-busy={busy}
    >
      <img
        src="/miss-julie-welcome.png"
        alt="Miss Julie, your Talkora English teacher"
      />
      <span className="character-spark spark-one" aria-hidden="true">+</span>
      <span className="character-spark spark-two" aria-hidden="true">+</span>
    </button>
  )
}

export function CartoonCompanions() {
  return (
    <div className="cartoon-companions" aria-hidden="true">
      <span className="pip">Pip</span>
      <span className="tiko">Tiko</span>
      <span className="bobo">Bobo</span>
    </div>
  )
}
