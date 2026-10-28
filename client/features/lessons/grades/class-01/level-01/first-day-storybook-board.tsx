'use client'

import { ArrowUp, Bell, BookOpen, Footprints, MessageCircle, Mic, School, Sparkles } from 'lucide-react'
import type { Class1TeachingCue } from './first-day-voice-guide'
import styles from './first-day-storybook-board.module.css'

type Props = {
  cue: Class1TeachingCue
  isListening: boolean
  isSpeaking: boolean
  isProcessing: boolean
  isCompleted: boolean
  isRetry: boolean
}

/** A visual companion to the live lesson. No extra TTS, STT, answer checks or progress writes. */
export function Class1StorybookBoard({ cue, isListening, isSpeaking, isProcessing, isCompleted, isRetry }: Props) {
  const { focus, tiles, example, illustration } = cue.storybook
  const isFoundation = cue.phase === 'FOUNDATION'
  const feedback = isCompleted ? 'You did it! On to the next page.'
    : isRetry ? 'No hurry. Listen to Julie and try once more.'
      : isProcessing ? 'Miss Julie is thinking about your answer.'
        : isListening ? 'The magic board is listening to you!'
          : isSpeaking ? 'Listen to Miss Julie first.'
            : 'Your turn! Say it to Miss Julie.'

  return (
    <section className={`${styles.storybook} ${isCompleted ? styles.celebrating : ''}`} aria-label="Miss Julie's interactive word book">
      <header className={styles.header}>
        <span><BookOpen size={17} aria-hidden="true" /> {isFoundation ? 'LITTLE WORD MAGIC' : 'BALBHARATI 1.1 · MY FIRST DAY'}</span>
        <span className={styles.chapter}>{isFoundation ? 'GETTING READY' : 'CHAPTER 1.1'}</span>
      </header>

      <div className={styles.spread}>
        <div className={styles.picturePage}>
          <span className={styles.pageLabel}>{isFoundation ? 'Let’s make words!' : 'Look and learn!'}</span>
          <div className={styles.scene} role="img" aria-label={illustration === 'ball-on-box' ? 'A ball resting on a box' : illustration === 'up-arrow' ? 'An arrow going up' : illustration === 'school' ? 'Our school and its bell' : illustration === 'walk' ? 'Footsteps going to school' : illustration === 'talk' ? 'A speech bubble for talking' : `Letters joining to make ${focus}`}>
            {illustration === 'spark' ? (
              <div className={styles.letterStage}>
                {tiles.map((tile, i) => <span className={styles.letterGroup} key={`${tile}-${i}`}><b className={styles.magneticLetter}>{tile}</b>{i < tiles.length - 1 ? <i aria-hidden="true">+</i> : null}</span>)}
                <span className={styles.magicArrow} aria-hidden="true">→</span>
              </div>
            ) : null}
            {illustration === 'ball-on-box' ? <div className={styles.ballStack}><span className={styles.ball} /><span className={styles.box} /></div> : null}
            {illustration === 'up-arrow' ? <ArrowUp className={styles.risingArrow} size={100} strokeWidth={3} aria-hidden="true" /> : null}
            {illustration === 'school' ? <div className={styles.pictogram}><School size={96} strokeWidth={1.7} /><Bell size={28} /></div> : null}
            {illustration === 'walk' ? <div className={styles.walkingFeet}><Footprints size={100} strokeWidth={1.6} /><School size={34} strokeWidth={1.8} /></div> : null}
            {illustration === 'talk' ? <MessageCircle className={styles.talkBubble} size={100} strokeWidth={1.7} aria-hidden="true" /> : null}
            <Sparkles className={styles.star} size={26} aria-hidden="true" />
          </div>
          <strong className={styles.focusWord}>{focus}</strong>
        </div>

        <div className={styles.teachingPage}>
          <span className={styles.pageLabel}>{isFoundation ? 'MISSION: SAY THE WORD' : 'OUR SCHOOL STORY'}</span>
          <strong className={styles.headline}>{cue.headline}</strong>
          <div className={styles.wordTiles} aria-label="Words on this page">
            {tiles.map((tile, i) => <span key={`${tile}-${i}`}>{tile}</span>)}
          </div>
          <p className={styles.example} aria-label="Example sentence">{example}</p>
          <p className={styles.goal}>{cue.spokenGoal}</p>
        </div>
      </div>

      <footer className={`${styles.status} ${isListening ? styles.listening : ''}`} role="status" aria-live="polite">
        <Mic size={17} aria-hidden="true" />
        <span>{feedback}</span>
        <span className={styles.soundWaves} aria-hidden="true"><i /><i /><i /></span>
      </footer>
    </section>
  )
}
