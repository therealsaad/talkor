
'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { CSSProperties } from 'react'
import { ArrowLeft, Headphones, Sparkles } from 'lucide-react'

import { AnimatedMissJulie } from '../level-01/components/AnimatedMissJulie'

import '../level-01/styles/kg-alphabet.css'
import '../level-01/styles/kg-level1-polish.css'

const LESSONS = [
  { letter: 'W', word: 'Watermelon', emoji: '🍉', color: '#e8798d' },
  { letter: 'X', word: 'Xylophone', emoji: '🎼', color: '#8d83e8' },
  { letter: 'Y', word: 'Yo-yo', emoji: '🪀', color: '#e9ae42' },
  { letter: 'Z', word: 'Zebra', emoji: '🦓', color: '#69b85e' },
]

export default function LevelExperience() {
  const [index, setIndex] = useState(0)
  const current = LESSONS[index]

  return (
    <main
      className="kg-alpha kg-alpha-play is-preview"
      aria-label="KG Level 5 W to Z"
    >
      <Image
        className="kg-alpha-garden-art"
        src="/lessons/kg/images/level-1-meadow.png"
        alt=""
        fill
        priority
        sizes="100vw"
      />

      <div className="kg-alpha-garden-wash" aria-hidden="true" />

      <header className="kg-alpha-play-top">
        <button
          type="button"
          className="kg-alpha-map-link"
          onClick={() => window.history.back()}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="kg-alpha-progress-wrap">
          <span>KG LEVEL 5 · WXYZ</span>
          <div className="kg-alpha-step-bar">
            {LESSONS.map((lesson, i) => (
              <i
                key={lesson.letter}
                className={
                  i < index
                    ? 'done'
                    : i === index
                      ? 'current'
                      : ''
                }
              />
            ))}
          </div>
        </div>

        <div className="kg-alpha-audio-actions">
          <span className="kg-alpha-level-pill">
            <Sparkles size={15} />
            LETTER GARDEN
          </span>
        </div>
      </header>

      <div className="kg-alpha-scene">
        <aside className="kg-alpha-teacher">
          <div className="kg-alpha-teacher-glow" aria-hidden="true" />

          <AnimatedMissJulie state="idle" />

          <div className="kg-alpha-speech" role="status">
            Hello, superstar! Let's learn {current.letter}!
          </div>
        </aside>

        <section
          className="kg-alpha-quest kg-alpha-teaching-board"
          aria-label="Level 5 letter activity"
        >
          <div className="kg-alpha-learning">
            <span className="kg-alpha-activity-label">
              <Headphones size={17} />
              LOOK · LEARN · SAY IT
            </span>

            <div
              className="kg-alpha-lesson-art kg-board-lesson"
              style={
                { '--letter-color': current.color } as CSSProperties
              }
            >
              <div
                className="kg-alpha-letter-orb"
                aria-label={`Letter ${current.letter}`}
              >
                <span>{current.letter}</span>
                <small>{current.letter} is for</small>
              </div>

              <div
                className="kg-board-object"
                role="img"
                aria-label={current.word}
                style={{
                  fontSize: 'clamp(5rem, 12vw, 9rem)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {current.emoji}
              </div>
            </div>

            <h1>
              <span>{current.letter}</span> for{' '}
              <strong>{current.word}!</strong>
            </h1>

            <p>
              Look at the picture, learn the word, and
              practise saying it with Miss Julie.
            </p>

            <button
              type="button"
              className="kg-story-play"
              onClick={() =>
                setIndex((previous) => (previous + 1) % LESSONS.length)
              }
            >
              {index === 3 ? 'Start W–Z Again' : 'Next Letter →'}
            </button>
          </div>
        </section>
      </div>

      <p className="kg-alpha-preview-tag">
        <Sparkles size={14} />
        UI PREVIEW · NOT YET A PLAYABLE LESSON
      </p>
    </main>
  )
}
