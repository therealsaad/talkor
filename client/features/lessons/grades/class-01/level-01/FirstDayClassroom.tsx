'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import './first-day-classroom.css'

type FirstDayClassroomProps = {
  sceneId: string
  focus: string
  sentence: string
  teacherText: string
  teacherImage: string
  animationUrl: string | null
  isSpeaking: boolean
  isListening: boolean
  isProcessing: boolean
  isCompleted: boolean
  transcript?: string
  feedback?: string
}

const props: Record<string, { icon: string; label: string; joke: string }> = {
  'hello-school': { icon: '🎒', label: 'Welcome to school', joke: 'Wave hello!' },
  'skip-bunny': { icon: '🐰', label: 'Skip like a bunny', joke: 'Hop, hop, hop!' },
  'run-race': { icon: '🏃', label: 'Run in the playground', joke: 'Ready, steady, go!' },
  'walk-school': { icon: '👣', label: 'Walk to school', joke: 'Tip, tap, tip, tap!' },
  'big-grin': { icon: '😁', label: 'Make a funny grin', joke: 'Big smile!' },
  'school-bell': { icon: '🔔', label: 'Listen to the bell', joke: 'Ding, dong!' },
  'jump-frog': { icon: '🐸', label: 'Jump like a frog', joke: 'Ribbit, ribbit!' },
  'play-friends': { icon: '⚽', label: 'Play at school', joke: 'Bounce, bounce!' },
  'enter-class': { icon: '🚪', label: 'Go into class', joke: 'Come on in!' },
  'grade-one': { icon: '🎉', label: 'Grade One celebration', joke: 'Hooray!' },
}

export function FirstDayClassroom({
  sceneId, focus, sentence, teacherText, teacherImage, animationUrl,
  isSpeaking, isListening, isProcessing, isCompleted, transcript, feedback,
}: FirstDayClassroomProps) {
  const reduceMotion = useReducedMotion()
  const [videoReady, setVideoReady] = useState(false)
  useEffect(() => setVideoReady(false), [animationUrl])
  const scene = props[sceneId] || props['hello-school']
  const status = isListening ? 'Your turn! Speak to Miss Julie'
    : isProcessing ? 'Miss Julie is thinking…'
    : isSpeaking ? 'Listen to Miss Julie'
    : isCompleted ? 'Amazing! Our next adventure!'
    : 'Listen, ask a question, or try the sentence'
  return (
    <div className="firstday-stage" data-firstday-scene={sceneId} data-testid="class1-firstday-adventure">
      <div className="firstday-teacher">
        <div className="firstday-teacher__name">MISS JULIE <span aria-hidden="true">✦</span></div>
        <div className="firstday-teacher__portrait">
          <Image src={teacherImage} width={480} height={700} priority
            alt="Miss Julie, your English teacher" sizes="35vw"
            className={videoReady ? 'firstday-teacher__still is-hidden' : 'firstday-teacher__still'} />
          {animationUrl && !reduceMotion ? <video key={animationUrl}
            className={videoReady ? 'firstday-teacher__animation is-ready' : 'firstday-teacher__animation'}
            aria-hidden="true" autoPlay muted loop playsInline preload="metadata"
            src={animationUrl} onLoadedData={() => setVideoReady(true)}
            onError={() => setVideoReady(false)} /> : null}
        </div>
        <div className="firstday-teacher__line" aria-live={isSpeaking ? 'off' : 'polite'}>
          <span className="firstday-teacher__quote" aria-hidden="true">“</span>
          {teacherText || 'Hello! I am Miss Julie. Let us learn about our first day at school!'}
        </div>
      </div>
      <section className="firstday-book" aria-label="Balbharati My First Day interactive lesson">
        <div className="firstday-book__top">
          <span className="firstday-book__chapter">ENGLISH BALBHARATI · 1.1</span>
          <span className="firstday-book__sticker">MY FIRST DAY</span>
        </div>
        <div className="firstday-book__art">
          <svg className="firstday-school" viewBox="0 0 760 315" role="img" aria-label="A colourful school, garden and path" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="firstdaySky" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#c8efff"/><stop offset="1" stopColor="#efffe2"/></linearGradient>
            </defs>
            <rect width="760" height="315" rx="26" fill="url(#firstdaySky)"/>
            <circle cx="648" cy="67" r="39" fill="#ffe27b" className="firstday-sun"/>
            <g fill="#fff" opacity=".85"><ellipse cx="94" cy="63" rx="64" ry="21"/><ellipse cx="128" cy="49" rx="39" ry="28"/><ellipse cx="554" cy="55" rx="49" ry="18"/></g>
            <path d="M0 246 Q210 219 389 249 T760 242 V315 H0 Z" fill="#7dcaa0"/>
            <path d="M286 315 Q325 247 366 240 H433 Q474 251 517 315" fill="#f7ddaa"/>
            <rect x="204" y="111" width="358" height="146" rx="13" fill="#ffca8d" stroke="#cd8449" strokeWidth="5"/>
            <path d="M178 117 L382 40 L587 117 Z" fill="#de6a62" stroke="#b44647" strokeWidth="5"/>
            <rect x="350" y="183" width="77" height="74" rx="8" fill="#29748f"/>
            <path d="M389 183 V256" stroke="#bce8ed" strokeWidth="4"/>
            <g fill="#76c4ee" stroke="#fff8dc" strokeWidth="9"><rect x="244" y="142" width="59" height="55" rx="6"/><rect x="460" y="142" width="59" height="55" rx="6"/></g>
            <rect x="319" y="105" width="128" height="40" rx="9" fill="#fffaf0"/>
            <text x="383" y="132" textAnchor="middle" fontSize="22" fontWeight="900" fill="#1a6870">SCHOOL</text>
            <g><rect x="111" y="181" width="17" height="78" fill="#9a704e"/><circle cx="119" cy="170" r="54" fill="#51af77"/><circle cx="84" cy="183" r="33" fill="#65c98c"/></g>
            <g><rect x="620" y="191" width="14" height="70" fill="#9a704e"/><circle cx="626" cy="180" r="46" fill="#48a871"/></g>
            <g fill="#fff5c1"><circle cx="74" cy="282" r="7"/><circle cx="112" cy="277" r="7"/><circle cx="669" cy="285" r="7"/><circle cx="706" cy="275" r="7"/></g>
          </svg>
          <motion.div className="firstday-book__character"
            animate={reduceMotion ? {} : { y: [0, -14, 0], rotate: [-5, 7, -5] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden="true">{scene.icon}</motion.div>
          <span className="firstday-book__action">{scene.joke}</span>
        </div>
        <div className="firstday-book__text">
          <div className="firstday-book__title">{scene.label}</div>
          <strong>{focus}</strong>
          <p>{sentence}</p>
        </div>
        <div className="firstday-book__footer" role="status" aria-live="polite">
          <span className={isListening ? 'firstday-book__mic is-live' : 'firstday-book__mic'} aria-hidden="true">
            {isListening ? '🎙️' : isProcessing ? '💭' : isSpeaking ? '🔊' : '✨'}
          </span>
          <span>{status}</span>
        </div>
        {transcript ? <div className="firstday-book__transcript">You said: {transcript}</div> : null}
        {feedback ? <div className="firstday-book__feedback" role="alert">{feedback}</div> : null}
      </section>
      <div className="firstday-rotate" role="status">Please rotate your screen to landscape to learn with Miss Julie.</div>
    </div>
  )
}
