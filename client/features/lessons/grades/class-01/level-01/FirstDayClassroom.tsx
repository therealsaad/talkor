'use client'

import Image from 'next/image'
import { useEffect, useState, type CSSProperties } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { BookOpen, Headphones, Mic, RefreshCw, Sparkles, Volume2, VolumeX, Waves } from 'lucide-react'
import './first-day-classroom.css'

type Props = {
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
  isRetry?: boolean
  transcript?: string
  feedback?: string
  modelSentence?: string
  needsAudioGesture?: boolean
  isAudioEnabled?: boolean
  onReplayJulie?: () => void
  onEnableAudio?: () => void
  onStartMic?: () => void
  onStopMic?: () => void
  step?: number
  total?: number
}

type Scene = { icon: string; name: string; action: string; meaning: string; hintHi: string; hintMr: string; colour: string; visual: 'gate' | 'skip' | 'run' | 'walk' | 'grin' | 'bell' | 'jump' | 'play' | 'door' | 'celebrate' }
const SCENES: Record<string, Scene> = {
  'hello-school': { icon:'🏫', name:'Our first school day', action:'Wave hello!', meaning:'This is my school.', hintHi:'School = स्कूल', hintMr:'School = शाळा', colour:'#84d7c5', visual:'gate' },
  'skip-bunny': { icon:'🐇', name:'Skip, skip!', action:'Show skipping fingers!', meaning:'Skip = little jumping steps', hintHi:'Skip = उछलकर चलना', hintMr:'Skip = उड्या मारत जाणे', colour:'#f6cb76', visual:'skip' },
  'run-race': { icon:'🏃', name:'Let us run', action:'Run your fingers!', meaning:'Run = move fast', hintHi:'Run = दौड़ना', hintMr:'Run = धावणे', colour:'#a5c7ef', visual:'run' },
  'walk-school': { icon:'👣', name:'Walk to school', action:'Tip, tap, tip, tap!', meaning:'Walk = take steps', hintHi:'Walk = चलना', hintMr:'Walk = चालणे', colour:'#b6dfa5', visual:'walk' },
  'big-grin': { icon:'😁', name:'A lovely grin', action:'Show your biggest smile!', meaning:'Grin means smile', hintHi:'Grin = मुस्कुराना', hintMr:'Grin = हसणे', colour:'#f4b7ae', visual:'grin' },
  'school-bell': { icon:'🔔', name:'Ding dong!', action:'Listen for the bell!', meaning:'The bell rings at school', hintHi:'Bell = घंटी', hintMr:'Bell = घंटा', colour:'#eac6f1', visual:'bell' },
  'jump-frog': { icon:'🐸', name:'Jump up!', action:'Jump your fingers!', meaning:'Jump = leave the ground', hintHi:'Jump = कूदना', hintMr:'Jump = उडी मारणे', colour:'#b6e4a9', visual:'jump' },
  'play-friends': { icon:'⚽', name:'Play with friends', action:'Pretend to kick a ball!', meaning:'Play = have fun together', hintHi:'Play = खेलना', hintMr:'Play = खेळणे', colour:'#ffd49b', visual:'play' },
  'enter-class': { icon:'🚪', name:'Come into class', action:'The bell rings. Go in!', meaning:'Go in = enter the room', hintHi:'Go in = अंदर जाना', hintMr:'Go in = आत जाणे', colour:'#b9d6fc', visual:'door' },
  'grade-one': { icon:'🌟', name:'I am in Grade One!', action:'Celebrate what you learned!', meaning:'Hurray = a happy cheer', hintHi:'Hurray = खुशी से बोलो!', hintMr:'Hurray = आनंदाने म्हणा!', colour:'#ffd48b', visual:'celebrate' },
}

/** The page-one word bank is shown through ten smaller, oral teaching scenes.
 * It intentionally does not reproduce the textbook rhyme or illustrations. */
const WORD_BANK: Record<string, readonly string[]> = {
  'hello-school': ['see', 'school', 'everyone'],
  'skip-bunny': ['see', 'skip'],
  'run-race': ['see', 'run'],
  'walk-school': ['walk', 'school'],
  'big-grin': ['grin', 'see'],
  'school-bell': ['bell', 'rings'],
  'jump-frog': ['jump'],
  'play-friends': ['play'],
  'enter-class': ['bell', 'rings', 'school'],
  'grade-one': ['Grade', 'One', 'hurray'],
}

/** Pure presentation: never creates a recording, grades a response, changes
 * a step or invents a teacher reply. The authenticated lesson engine owns all
 * speaking, Qwen/Azure requests and MongoDB progress. */
export function FirstDayClassroom({
  sceneId, focus, sentence, teacherText, teacherImage, animationUrl,
  isSpeaking, isListening, isProcessing, isCompleted, isRetry = false,
  transcript, feedback, modelSentence, needsAudioGesture = false,
  isAudioEnabled = true, onReplayJulie, onEnableAudio, onStartMic, onStopMic,
  step = 1, total = 10,
}: Props) {
  const reduceMotion = useReducedMotion()
  const [videoReady, setVideoReady] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  useEffect(() => { setVideoReady(false); setVideoFailed(false) }, [animationUrl])
  const scene = SCENES[sceneId] || SCENES['hello-school']
  const safelyAnimating = Boolean(animationUrl && !reduceMotion && !videoFailed)
  const status = needsAudioGesture ? 'Sound needs permission'
    : isListening ? 'I am listening to you'
    : isProcessing ? 'Thinking about your answer'
    : isSpeaking ? 'Listen to Miss Julie'
    : isCompleted ? 'You learned this!'
    : isRetry ? 'We will try together'
    : 'Your turn to speak'
  const phase = isListening ? 'listening' : isProcessing ? 'thinking' : isSpeaking ? 'speaking' : isCompleted ? 'celebrating' : isRetry ? 'encouraging' : 'ready'

  return <section className="firstday-stage" data-firstday-scene={sceneId} data-phase={phase} data-testid="class1-firstday-adventure" aria-label="Balbharati My First Day speaking classroom">
    <header className="firstday-topline">
      <div className="firstday-topline__identity"><span className="firstday-topline__book"><BookOpen size={19} aria-hidden="true" /></span>
        <div><strong>MY FIRST DAY</strong><small>ENGLISH BALBHARATI · LESSON 1.1</small></div></div>
      <div className="firstday-lesson-progress" aria-label={`Scene ${step} of ${total}`}>
        <span>Adventure {step} / {total}</span>
        <div className="firstday-progress-track" role="progressbar" aria-label="Chapter progress" aria-valuenow={step} aria-valuemin={1} aria-valuemax={total}>
          <i style={{ width: `${Math.round(step / Math.max(1, total) * 100)}%` }} />
        </div>
      </div>
    </header>

    <div className="firstday-layout">
      <aside className="firstday-teacher" aria-label="Miss Julie animated teacher">
        <div className="firstday-teacher__aura" aria-hidden="true" />
        <div className="firstday-teacher__name"><span className="firstday-teacher__live-dot" /> Miss Julie <span>✦</span></div>
        <div className="firstday-teacher__portrait" data-animation={safelyAnimating ? (videoReady ? 'playing' : 'loading') : 'fallback'}>
          {safelyAnimating ? <video
            key={animationUrl}
            className={videoReady ? 'firstday-teacher__animation is-ready' : 'firstday-teacher__animation'}
            src={animationUrl || undefined} autoPlay muted loop playsInline preload="metadata"
            aria-hidden="true"
            onLoadedData={() => setVideoReady(true)}
            onPlaying={() => setVideoReady(true)}
            onError={() => { setVideoFailed(true); setVideoReady(false) }}
          /> : null}
          {!safelyAnimating || !videoReady ? <Image src={teacherImage} width={430} height={610} priority
            alt={reduceMotion ? 'Miss Julie, your teacher' : 'Miss Julie animation fallback'}
            sizes="(max-width: 750px) 32vw, 30vw"
            className={safelyAnimating ? 'firstday-teacher__still is-loading' : 'firstday-teacher__still'} /> : null}
        </div>
        <div className="firstday-teacher__status"><span className="firstday-status-signal" aria-hidden="true" /><strong>{status}</strong></div>
      </aside>

      <div className="firstday-lesson-content">
        <div className="firstday-book">
          <div className="firstday-book__top"><span>✦ LOOK · LISTEN · SAY</span><small>{scene.name}</small></div>
          <div className="firstday-book__art">
            <div className="firstday-board-scene" data-action={scene.visual} style={{ '--scene-accent':scene.colour } as CSSProperties}>
              <svg className="firstday-school" viewBox="0 0 600 205" role="img" aria-label="Original illustrated school with garden and a path" preserveAspectRatio="xMidYMid meet">
                <defs><linearGradient id="talkoraSchoolSky" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#c7eeff"/><stop offset="1" stopColor="#f0fbd8"/></linearGradient></defs>
                <rect width="600" height="205" rx="22" fill="url(#talkoraSchoolSky)" />
                <circle cx="522" cy="37" r="22" fill="#ffe090"/>
                <path d="M0 160 Q140 143 265 165 T600 157 V205 H0Z" fill="#a4d8a0"/>
                <path d="M245 205 Q268 169 296 151 H338 Q361 165 383 205Z" fill="#f9d59b"/>
                <rect x="167" y="83" width="274" height="84" rx="8" fill="#ffe0ad" stroke="#b88064" strokeWidth="3"/>
                <path d="M148 85 303 33 459 85Z" fill="#e3887c" stroke="#ba7067" strokeWidth="3"/>
                <rect x="276" y="112" width="53" height="55" rx="5" fill="#4c9698" />
                <rect x="189" y="106" width="44" height="34" rx="4" fill="#96dced" stroke="#fff9e8" strokeWidth="5"/>
                <rect x="374" y="106" width="44" height="34" rx="4" fill="#96dced" stroke="#fff9e8" strokeWidth="5"/>
                <rect x="262" y="70" width="85" height="29" rx="7" fill="#fff9ea"/>
                <text x="304" y="89" textAnchor="middle" fontSize="15" fontWeight="900" fill="#347562">SCHOOL</text>
                <g fill="#56ae7c"><circle cx="77" cy="123" r="32"/><circle cx="515" cy="131" r="29"/></g>
                <g stroke="#89654d" strokeWidth="6"><path d="M77 131v40M515 135v35"/></g>
              </svg>
              <motion.div className="firstday-book__character" aria-hidden="true"
                animate={reduceMotion ? undefined : scene.visual === 'bell' ? {rotate: [-11,10,-11]}
                  : scene.visual === 'grin' ? { scale: [1,1.13,1] }
                  : scene.visual === 'celebrate' ? {y:[0,-21,0], rotate:[-8,9,-8]}
                  : { y:[0,-15,0],x:[0,9,0] }}
                transition={{duration: 1.8, repeat: Infinity, ease:'easeInOut'}}>{scene.icon}</motion.div>
              <span className="firstday-book__action">{scene.action}</span>
            </div>
          </div>
          <div className="firstday-book__text">
            <span className="firstday-book__title">TODAY'S MAGIC WORD</span>
            <strong>{focus}</strong>
            <p>{sentence}</p>
            <div className="firstday-meaning"><Sparkles size={16} aria-hidden="true" /><span>{scene.meaning}</span></div>
            <div className="firstday-word-bank" aria-label="Words to look at and say">
              {(WORD_BANK[sceneId] || WORD_BANK['hello-school']).map(word => <span key={word}>{word}</span>)}
            </div>
          </div>
          {isRetry ? <div className="firstday-help" role="note"><span>Need a hint?</span><span lang="hi">{scene.hintHi}</span><span lang="mr">{scene.hintMr}</span></div> : null}
        </div>

        <div className="firstday-coaching" aria-label="Miss Julie speaking and listening">
          <div className="firstday-coaching__top"><span>MISS JULIE SAYS</span><span>{isSpeaking ? <Waves size={18} aria-label="Voice playing" /> : isListening ? <Mic size={18} aria-label="Microphone live" /> : <Sparkles size={17} />}</span></div>
          <p className="firstday-teacher__line" aria-live={isSpeaking ? 'off' : 'polite'}>{teacherText || 'Hello, superstar! Let us learn together. Listen, then say the word.'}</p>
          {modelSentence && isRetry ? <p className="firstday-model" aria-label="Try this English sentence"><strong>Say with me:</strong> {modelSentence}</p> : null}
          {transcript ? <p className="firstday-book__transcript"><span>You said:</span> {transcript}</p> : null}
          {feedback ? <p className="firstday-book__feedback" role="alert">{feedback}</p> : null}
          <div className="firstday-book__footer" role="status" aria-live="polite">
            <div className="firstday-mic-indicator" data-live={isListening} aria-hidden="true"><Mic size={21}/></div>
            <strong>{status}</strong>
            <div className="firstday-controls">
              {needsAudioGesture && onEnableAudio ? <button type="button" onClick={onEnableAudio} aria-label="Enable Miss Julie sound"><VolumeX size={19}/> Enable sound</button> : null}
              {!isSpeaking && !isProcessing && !isListening && !needsAudioGesture && isAudioEnabled && onReplayJulie ? <button type="button" onClick={onReplayJulie} aria-label="Hear Miss Julie again"><Volume2 size={19}/> Hear again</button> : null}
              {!isSpeaking && !isProcessing && !isListening && !isCompleted && !needsAudioGesture && onStartMic ? <button type="button" className="firstday-mic-button" onClick={onStartMic} aria-label="Speak to Miss Julie"><Mic size={19}/> Speak</button> : null}
              {isListening && onStopMic ? <button type="button" className="firstday-mic-button" onClick={onStopMic} aria-label="Done speaking to Miss Julie"><RefreshCw size={18}/> Done speaking</button> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className="firstday-rotate" role="status">Turn your screen sideways to learn with Miss Julie.</div>
  </section>
}
