'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { BookOpen, ChevronLeft, ChevronRight, Headphones, LoaderCircle, Map, Volume2 } from 'lucide-react'
import { useReducedMotion } from 'framer-motion'
import { useAuth } from '@/components/auth/auth-provider'
import { TalkoraLoader } from '@/components/student/talkora-loader'
import { apiClientBlob } from '@/lib/api-client'
import { AnimatedMissJulie } from '../level-01/components/AnimatedMissJulie'
import { KindergartenWorld } from '../components/KindergartenWorld'
import { LetterWordPicture } from '../components/LetterWordPicture'
import { kgLevel2StudentService } from '../level-02/services/kg-level2-student-service'
import { kgContinuationStudentService } from '../continuation/continuation-service'
import '../level-01/styles/kg-alphabet.css'
import '../level-01/styles/kg-level1-polish.css'
import '../components/kindergarten-world.css'
import '../level-02/level-02.css'
import './completed-level-review.css'

export type KGReviewLevel = 2 | 3 | 4 | 5

/** Same approved letter/word/picture pairs shown in the KG student lessons.
 * No answer keys, grade, replay submission or reward endpoints are used here.
 */
const CONTENT: Record<KGReviewLevel, { letters: readonly string[]; words: Record<string, string>; pictures: Record<string, string>; emojis?: Record<string, string> }> = {
  2: {
    letters: ['E', 'F', 'G', 'H', 'I', 'J'],
    words: { E: 'elephant', F: 'fish', G: 'goat', H: 'hat', I: 'igloo', J: 'jam' },
    pictures: {
      E: '/kg/pictures/level-2/elephant.svg', F: '/kg/pictures/level-2/fish.svg',
      G: '/kg/pictures/level-2/goat.svg', H: '/kg/pictures/level-2/hat.svg',
      I: '/kg/pictures/level-2/igloo.svg', J: '/kg/pictures/level-2/jam.svg',
    },
  },
  3: {
    letters: ['K', 'L', 'M', 'N', 'O', 'P'],
    words: { K: 'kite', L: 'lion', M: 'monkey', N: 'nest', O: 'orange', P: 'parrot' },
    pictures: {
      K: '/kg/pictures/level-3/kite.svg', L: '/kg/pictures/level-3/lion.svg',
      M: '/kg/pictures/level-3/monkey.svg', N: '/kg/pictures/level-3/nest.svg',
      O: '/kg/pictures/level-3/orange.svg', P: '/kg/pictures/level-3/parrot.svg',
    },
  },
  4: {
    letters: ['Q', 'R', 'S', 'T', 'U', 'V'],
    words: { Q: 'queen', R: 'rabbit', S: 'sun', T: 'tiger', U: 'umbrella', V: 'van' },
    pictures: {}, emojis: { Q: '👑', R: '🐇', S: '☀️', T: '🐅', U: '☂️', V: '🚐' },
  },
  5: {
    letters: ['W', 'X', 'Y', 'Z'],
    words: { W: 'wolf', X: 'xylophone', Y: 'yak', Z: 'zebra' },
    pictures: {
      W: '/kg/pictures/level-5/wolf.jpg', X: '/kg/pictures/level-5/xylophone.jpg',
      Y: '/kg/pictures/level-5/Yak.jpg', Z: '/kg/pictures/level-5/zebra.jpg',
    },
  },
}

function completedNarrationUrl(level: KGReviewLevel, id: string) {
  return level === 2
    ? '/kg-level2/review/narration/' + id
    : '/kg-continuation/' + level + '/review/narration/' + id
}

export function KGCompletedLevelReview({ level }: { level: KGReviewLevel }) {
  const { student, status } = useAuth()
  const reduceMotion = useReducedMotion()
  const [verifiedOwner, setVerifiedOwner] = useState('')
  const [error, setError] = useState('')
  const [index, setIndex] = useState(0)
  const [speaking, setSpeaking] = useState(false)
  const [audioError, setAudioError] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  const content = CONTENT[level]
  const ownerKey = student?.id + ':' + level
  const canReview = status === 'authenticated' && student?.grade === 0 && verifiedOwner === ownerKey
  const letter = content.letters[index]
  const word = content.words[letter]

  const stopAudio = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    audioRef.current?.pause()
    audioRef.current = null
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    objectUrlRef.current = null
  }, [])

  useEffect(() => {
    let live = true
    setVerifiedOwner('')
    setError('')
    setAudioError('')
    setIndex(0)
    stopAudio()
    if (status !== 'authenticated' || !student?.id) return () => { live = false }
    if (student.grade !== 0) {
      setError('This garden belongs to Kindergarten students.')
      return () => { live = false }
    }
    const request = level === 2
      ? kgLevel2StudentService.state()
      : kgContinuationStudentService.state(level)
    void request.then((saved) => {
      if (!live) return
      if (!saved.completed) {
        setError('Finish this level with Miss Julie before opening revision.')
        return
      }
      setVerifiedOwner(student.id + ':' + level)
    }).catch(() => {
      if (live) setError('Your saved lesson could not be checked. Please open your map and try again.')
    })
    return () => { live = false; stopAudio() }
  }, [status, student?.id, student?.grade, level, stopAudio])

  const hearJulie = useCallback(async () => {
    if (!canReview || speaking) return
    stopAudio()
    setAudioError('')
    setSpeaking(true)
    const controller = new AbortController()
    abortRef.current = controller
    const suffix = letter.toLowerCase()
    const ids = level === 2
      ? ['letter-' + suffix, 'prompt-' + suffix]
      : ['letter-' + suffix, 'word-' + suffix, 'prompt-' + suffix]
    try {
      for (const id of ids) {
        const blob = await apiClientBlob(completedNarrationUrl(level, id), {
          signal: controller.signal, cache: 'no-store',
        })
        controller.signal.throwIfAborted()
        if (!blob.type.startsWith('audio/') || blob.size < 256) throw Error('Miss Julie audio is not ready.')
        const objectUrl = URL.createObjectURL(blob)
        objectUrlRef.current = objectUrl
        const audio = new Audio(objectUrl)
        audioRef.current = audio
        await new Promise<void>((resolve, reject) => {
          let done = false
          const finish = (failure?: Error) => {
            if (done) return
            done = true
            controller.signal.removeEventListener('abort', abort)
            audio.onended = null
            audio.onerror = null
            if (failure) reject(failure)
            else resolve()
          }
          const abort = () => { audio.pause(); finish(Error('Audio stopped')) }
          audio.onended = () => finish()
          audio.onerror = () => finish(Error('Miss Julie audio could not play.'))
          controller.signal.addEventListener('abort', abort, { once: true })
          void audio.play().catch(() => finish(Error('Tap Hear Miss Julie again to enable sound.')))
        })
        audio.pause()
        audioRef.current = null
        URL.revokeObjectURL(objectUrl)
        objectUrlRef.current = null
      }
    } catch {
      if (!controller.signal.aborted) setAudioError('Miss Julie could not speak right now. Check your sound and try again.')
    } finally {
      if (abortRef.current === controller) abortRef.current = null
      setSpeaking(false)
    }
  }, [canReview, speaking, stopAudio, letter, level])

  const move = (next: number) => {
    if (!canReview || next < 0 || next >= content.letters.length) return
    stopAudio()
    setSpeaking(false)
    setAudioError('')
    setIndex(next)
  }

  if (status !== 'authenticated' || (student?.grade === 0 && !canReview && !error)) {
    return <TalkoraLoader message="Miss Julie is opening your saved revision..." />
  }
  if (!canReview) {
    return <main className="kg-review-fallback" role="alert">
      <h1>Revision is not available yet</h1>
      <p>{error || 'Please use your Kindergarten PIN to open this garden.'}</p>
      <Link href="/student/kg/map">Back to my garden</Link>
    </main>
  }

  return (
    <main className="kg-level2-play kg-review" aria-label={'Completed KG Level ' + level + ' revision'}>
      <KindergartenWorld />
      <header className="kg-level2-play__top">
        <Link className="kg-level2-play__back" href="/student/kg/map"><Map size={17} /> My garden map</Link>
        <div className="kg-level2-play__progress">
          <span>LEVEL {level} · REVISION ONLY</span>
          <div className="kg-level2-play__steps" aria-label={'Reviewing ' + (index + 1) + ' of ' + content.letters.length + ' letters'}>
            {content.letters.map((name, i) => <i key={name} className={i < index ? 'done' : i === index ? 'current' : ''} />)}
          </div>
        </div>
        <span className="kg-level2-play__badge"><BookOpen size={15} /> Practice again</span>
      </header>
      <div className="kg-level2-play__scene">
        <aside className="kg-level2-play__teacher">
          <AnimatedMissJulie state={speaking ? 'speaking' : 'encouraging'} reducedMotion={Boolean(reduceMotion)} />
          <div className="kg-level2-play__speech" aria-live="polite">
            {speaking ? 'Listen to me! Then say it aloud!' : 'We already learned this! Let us practise again.'}
          </div>
        </aside>
        <section className="kg-level2-play__board kg-review__board" aria-label={'Level ' + level + ' completed lesson revision'}>
          <span className="kg-level2-play__eyebrow"><Headphones size={17} /> LISTEN · SAY · REVISE</span>
          {content.pictures[letter] ? (
            <LetterWordPicture
              key={letter} letter={letter} word={word}
              pictureSrc={content.pictures[letter]} reducedMotion={Boolean(reduceMotion)}
              className="kg-level2-letter-word-picture"
            />
          ) : (
            <div className="kg-level2-play__finished" aria-label={letter + ' for ' + word}>
              <div className="kg-level2-play__letter">{letter}</div>
              <span style={{ fontSize: 80 }} role="img" aria-label={word}>{content.emojis?.[letter]}</span>
              <h1>{word}</h1>
            </div>
          )}
          <p className="kg-review__hint">Say <strong>{letter}</strong> and <strong>{word}</strong> with Miss Julie. No marks—just practice!</p>
          {audioError ? <p role="alert" className="kg-review__error">{audioError}</p> : null}
          <button type="button" className="kg-level2-play__action" disabled={speaking} onClick={() => { void hearJulie() }}>
            {speaking ? <LoaderCircle className="kg-spin" size={19} /> : <Volume2 size={19} />}
            {speaking ? 'Miss Julie is speaking...' : 'Hear Miss Julie'}
          </button>
          <nav className="kg-review__navigation" aria-label="Revision letters">
            <button type="button" onClick={() => move(index - 1)} disabled={index === 0}><ChevronLeft size={20} /> Previous</button>
            <span>{index + 1} / {content.letters.length}</span>
            <button type="button" onClick={() => move(index + 1)} disabled={index === content.letters.length - 1}>Next <ChevronRight size={20} /></button>
          </nav>
          <p className="kg-review__note">Your completed level and stars stay saved. Revision does not change your progress.</p>
          <Link href="/student/continue" className="kg-review__resume">Continue my current lesson <ChevronRight size={17} /></Link>
        </section>
      </div>
    </main>
  )
}
