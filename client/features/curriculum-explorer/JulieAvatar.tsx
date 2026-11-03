'use client'
import { useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { talkoraAssets } from '@/config/talkora-assets'
import styles from './explorer.module.css'

type Pose = 'idle' | 'pointing' | 'listening' | 'encouraging' | 'celebrating'
/** Controlled visual only; no voice service, automatic speech, or microphone. */
export function JulieAvatar({ pose }: { pose: Pose }) {
  const reduced = useReducedMotion()
  const [ready, setReady] = useState<string | null>(null)
  const [imageFailed, setImageFailed] = useState(false)
  const image =
    pose === 'idle'
      ? talkoraAssets.julie.welcome
      : pose === 'celebrating'
        ? talkoraAssets.julie.celebrating
        : talkoraAssets.julie[pose]
  return (
    <div className={styles.julieAvatar} data-pose={pose}>
      {!imageFailed ? (
        <img
          className={styles.julieImage}
          src={image}
          alt="Miss Julie, Talkora’s teaching companion"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <svg
          className={styles.julieFallback}
          viewBox="0 0 180 260"
          role="img"
          aria-label="Illustrated Miss Julie with brown hair and a blue blazer"
        >
          <ellipse cx="88" cy="253" rx="43" ry="5" fill="#d9e0f5" />
          <path d="M59 191h60l-4 57H94l-4-38-6 38H60z" fill="#d5c5ad" />
          <path
            d="M58 244h27v10H49q0-6 9-10m36 0h21l12 10H94z"
            fill="#8a7769"
          />
          <path
            d="M55 65q-8-46 31-48 43-4 45 43l-3 55q9 22-10 28l-54-2q-22-13-15-32z"
            fill="#75503a"
          />
          <path d="M76 104v20h26v-20" fill="#ebc4a6" />
          <path d="M68 122q20-9 43 0l8 78H60z" fill="#fffcf7" />
          <path
            d="m71 119-20 10-20 67 16 5 17-47-6 49 25 2-6-76zM104 119l17 8 14 30-14 12-8-23 7 57-23 2 5-74z"
            fill="#91bddf"
          />
          <path
            d="m76 120-9 10 9 8-5 8 18 40-4-56zm27 0 9 11-8 7 5 8-16 40 2-56z"
            fill="#c4deef"
          />
          <path d="m32 193-4 15q-1 9 6 10 6 1 10-17z" fill="#ebc4a6" />
          <g className={styles.julieHand}>
            <path
              d="m120 151 13 14 16-24 11 7-19 33q-7 7-14-1l-17-20z"
              fill="#91bddf"
            />
            <path
              d="m147 146 4-12 1-12q1-5 4-1l1 13 3-15q1-5 4-1v16l3-12q2-4 4 0l-2 16q1 9-12 13z"
              fill="#ebc4a6"
            />
          </g>
          <ellipse cx="90" cy="73" rx="31" ry="38" fill="#f0cdb0" />
          <path
            d="M58 66q0-38 33-36 30-7 33 29-17-3-27-22-9 22-39 29z"
            fill="#79523b"
          />
          <path
            d="M63 65q-11 20-4 40-15-10-8-36m72-7q12 22 3 46l-7 12q7-29 4-58"
            fill="#79523b"
          />
          <path
            d="M69 65q7-4 14-1m15 0q7-4 14 1"
            stroke="#946b50"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <ellipse cx="77" cy="73" rx="6" ry="5" fill="white" />
          <ellipse cx="105" cy="73" rx="6" ry="5" fill="white" />
          <ellipse cx="78" cy="73" rx="3" ry="4" fill="#704b34" />
          <ellipse cx="104" cy="73" rx="3" ry="4" fill="#704b34" />
          <circle cx="79" cy="72" r="1" fill="white" />
          <circle cx="105" cy="72" r="1" fill="white" />
          <path
            d="m91 77-2 8 5 1"
            stroke="#d6ab90"
            strokeWidth="1.5"
            fill="none"
          />
          <path d="M80 94q10 10 22-1-9 3-22 1z" fill="#b97e73" />
          <path
            d="M84 95q7 2 13-1"
            stroke="#fff8f1"
            strokeWidth="2"
            fill="none"
          />
          <circle cx="59" cy="85" r="3" fill="#fffbef" />
          <circle cx="121" cy="85" r="3" fill="#fffbef" />
        </svg>
      )}
      {!reduced ? (
        <video
          key={pose}
          className={styles.julieVideo}
          style={{ opacity: ready === pose ? 1 : 0 }}
          src={`/miss-julie-animations/transparent/${pose}.webm`}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
          onCanPlay={() => setReady(pose)}
          onError={() => setReady(null)}
        />
      ) : null}
      <span className={styles.julieLabel}>
        Miss Julie
        <small>
          {imageFailed ? 'ILLUSTRATED STAND-IN' : 'VISUAL TEACHING PREVIEW'}
        </small>
      </span>
    </div>
  )
}
