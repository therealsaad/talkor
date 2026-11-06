'use client'
import { useReducer, useState } from 'react'
import {
  ArrowRight,
  Check,
  MessageCircle,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react'
import type { ExplorerPlan } from './model'
import { teachingSamples } from './model'
import {
  initialTeachingState,
  teachingTransition,
  type TeachingEvent,
} from './teaching-flow'
import { JulieAvatar } from './JulieAvatar'
import styles from './explorer.module.css'

export function TeachingPreview({
  plan,
  initialSample,
  onNext,
}: {
  plan: ExplorerPlan
  initialSample?: string
  onNext: (id: string) => void
}) {
  const samples = teachingSamples(plan)
  const [sampleId, setSampleId] = useState(
    initialSample ?? samples[0]?.id ?? ''
  )
  const [language, setLanguage] = useState<'en' | 'hi' | 'mr'>('en')
  const [state, dispatch] = useReducer(teachingTransition, initialTeachingState)
  const sample = samples.find((s) => s.id === sampleId) ?? samples[0]
  if (!sample)
    return (
      <div className={styles.notice}>
        <p>
          No teaching prompt has been authored for this level yet. Review its
          objectives in the coverage view.
        </p>
      </div>
    )
  let label = 'WELCOME & CONNECT',
    message =
      'Hi! I’m Miss Julie. We’ll listen, try, and learn one little step at a time.'
  if (state.phase === 'model') {
    label = 'MODEL & EXPLAIN'
    message = sample.prompt
  }
  if (['listen', 'practice-listen'].includes(state.phase)) {
    label = 'WAIT FOR THE CHILD'
    message = state.practice
      ? `Try the prompt again, with fewer clues: ${sample.prompt}`
      : sample.prompt
  }
  if (state.phase === 'support') {
    label =
      state.feedback === 'silence'
        ? 'GIVE TIME & REASSURE'
        : 'ENCOURAGE & EXPLAIN AGAIN'
    message =
      state.feedback === 'silence'
        ? {
            en: 'Take your time. I’ll wait. We can try the same little step when you’re ready.',
            hi: 'आराम से सोचो। मैं इंतज़ार करूँगी। तैयार होने पर फिर कोशिश करते हैं।',
            mr: 'सावकाश विचार कर. मी थांबते. तयार झाल्यावर पुन्हा प्रयत्न करूया.',
          }[language]
        : {
            en: `Good effort. Let’s try a smaller step together.${sample.model ? ` Listen: ${sample.model}.` : ' Your teacher can model one response, then invite another try.'}`,
            hi: `अच्छी कोशिश। एक छोटा कदम साथ में करते हैं।${sample.model ? ` सुनो: ${sample.model}.` : ' शिक्षक पहले एक उदाहरण बोलेंगे, फिर तुम कोशिश करो।'}`,
            mr: `छान प्रयत्न. एक छोटे पाऊल एकत्र घेऊया.${sample.model ? ` ऐक: ${sample.model}.` : ' शिक्षक आधी एक उदाहरण सांगतील, मग तू प्रयत्न कर.'}`,
          }[language]
  }
  if (state.phase === 'success') {
    label = 'ACKNOWLEDGE & CHECK'
    message =
      'Nice effort! Let’s try once more with fewer clues. One response is only part of our lesson.'
  }
  if (state.phase === 'practice') {
    label = 'GUIDED PRACTICE'
    message = `Try this idea with less help: ${sample.prompt}`
  }
  if (state.phase === 'gate') {
    label = 'PAUSE FOR THE WHOLE LESSON'
    message =
      'Before the next level, finish every assigned activity and check the written, movement, craft, or peer work with a teacher.'
  }
  if (state.phase === 'complete') {
    label = 'SIMULATED SIGN-OFF'
    message =
      'Our preview turn is complete. Actual progress and the next available lesson must still come from Talkora’s server.'
  }
  const phaseIndex =
    state.phase === 'ready'
      ? 0
      : state.phase === 'support'
        ? 2
        : ['practice', 'practice-listen'].includes(state.phase)
          ? 3
          : state.phase === 'gate'
            ? 4
            : state.phase === 'complete'
              ? 5
              : 1
  const pose =
    state.phase === 'support'
      ? 'encouraging'
      : ['listen', 'practice-listen'].includes(state.phase)
        ? 'listening'
        : state.phase === 'complete'
          ? 'celebrating'
          : state.phase === 'model' || state.phase === 'practice'
            ? 'pointing'
            : 'idle'
  const action = (event: TeachingEvent, title: string, primary = true) => (
    <button
      type="button"
      className={primary ? styles.primaryButton : styles.secondaryButton}
      onClick={() => dispatch(event)}
    >
      {title}
      <ArrowRight size={14} />
    </button>
  )
  return (
    <section aria-label="Miss Julie teaching-flow simulation">
      <div className={styles.sectionHead}>
        <div>
          <span className={styles.eyebrow}>A TEACHING TURN, MADE VISIBLE</span>
          <h2>Listen. Try. Learn together.</h2>
          <p>Inspect a mistake, silence, support, and a careful transition.</p>
        </div>
        <span className={styles.subtleBadge}>
          Scripted simulation · no microphone
        </span>
      </div>
      <div className={styles.previewToolbar}>
        <label>
          Chapter / activity
          <select
            aria-label="Preview chapter or activity"
            value={sample.id}
            onChange={(e) => {
              setSampleId(e.target.value)
              dispatch('RESET')
            }}
          >
            {samples.map((s) => (
              <option key={s.id} value={s.id}>
                {s.kind === 'idea' ? 'Idea · ' : ''}
                {s.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Hint language
          <select
            aria-label="Hint language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as typeof language)}
          >
            <option value="en">English</option>
            <option value="hi">Hindi + English</option>
            <option value="mr">Marathi + English</option>
          </select>
        </label>
        <button
          type="button"
          className={styles.textButton}
          onClick={() => dispatch('RESET')}
        >
          <RotateCcw size={13} />
          Restart
        </button>
      </div>
      {sample.issues.map((issue) => (
        <p className={styles.warning} key={issue}>
          {issue}
        </p>
      ))}
      {sample.kind === 'idea' ? (
        <div className={styles.notice}>
          <p>
            <b>Structure preview only.</b> This is an editorial idea. Its real
            prompt, model answer, visuals, and assessment rubric are not
            authored or approved.
          </p>
        </div>
      ) : null}
      {plan.config.grade === 1 && plan.config.level === 1 ? (
        <div className={styles.softNote}>
          Level 1 sequence: welcome/intro → existing two-letter activities →
          Balbharati 1.1 → practice. Choose a foundation activity above to
          inspect it. This preview does not play or replace the mandatory
          student intro.
        </div>
      ) : null}
      <div className={styles.previewGrid}>
        <div className={styles.classroom}>
          <div className={styles.classroomTop}>
            <span>
              {plan.config.id.toUpperCase()} · {sample.kind.toUpperCase()}
            </span>
            <b>STAFF PREVIEW</b>
          </div>
          <div className={styles.scene}>
            <JulieAvatar pose={pose} />
            <div className={styles.conversation}>
              <span className={styles.smallLabel}>{label}</span>
              <div className={styles.speech} role="status" aria-live="polite">
                <p lang={state.phase === 'support' ? language : 'en'}>
                  {message}
                </p>
                {sample.model && state.phase === 'model' ? (
                  <span className={styles.wordTarget}>{sample.model}</span>
                ) : null}
              </div>
              <p className={styles.sceneNote}>
                {['listen', 'practice-listen'].includes(state.phase)
                  ? 'Paused for a response. No timers or automatic advancement.'
                  : 'Staff-controlled outcome preview. No live AI or speech grading.'}
              </p>
            </div>
          </div>
          <div className={styles.previewActions}>
            {state.phase === 'ready'
              ? action('START', 'Start this teaching turn')
              : null}
            {['model', 'practice'].includes(state.phase)
              ? action('OPEN_TURN', 'Open the child’s turn')
              : null}
            {['listen', 'practice-listen'].includes(state.phase) ? (
              <>
                <p>Simulate the observed outcome:</p>
                <div className={styles.buttonRow}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => dispatch('EXPECTED')}
                  >
                    <Check size={14} />
                    Expected response
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => dispatch('HELP')}
                  >
                    <MessageCircle size={14} />
                    Needs support
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => dispatch('SILENCE')}
                  >
                    <Pause size={14} />
                    No response
                  </button>
                </div>
              </>
            ) : null}
            {state.phase === 'support' ? (
              <>
                {action('RETRY', 'Try the same prompt again')}
                <p>
                  Support stays in the current prompt and level. Change the hint
                  language above to inspect bilingual coaching.
                </p>
              </>
            ) : null}
            {state.phase === 'success'
              ? action('CONTINUE', 'Try guided practice')
              : null}
            {state.phase === 'gate' ? (
              <>
                {action('SIGN_OFF', 'Simulate teacher sign-off')}
                <p>
                  Only a simulation. This does not approve publication, mark a
                  plan as reviewed, record an attempt, or complete a student
                  level.
                </p>
              </>
            ) : null}
            {state.phase === 'complete' ? (
              <div className={styles.buttonRow}>
                {plan.config.level < 10 ? (
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() =>
                      onNext(
                        `g${String(plan.config.grade).padStart(2, '0')}-l${String(plan.config.level + 1).padStart(2, '0')}`
                      )
                    }
                  >
                    Inspect Level {plan.config.level + 1}
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <p>
                    The ten level addresses are inspected. Unverified chapter
                    coverage still needs teacher review.
                  </p>
                )}
                {action('RESET', 'Replay this flow', false)}
              </div>
            ) : null}
          </div>
        </div>
        <aside className={styles.flowPanel}>
          <span className={styles.eyebrow}>TEACHING LOGIC</span>
          <h3>A reply opens the next step.</h3>
          {[
            ['Welcome & connect', 'A familiar, friendly beginning'],
            ['Model, then listen', 'One prompt. One child’s turn.'],
            ['Adapt & try again', 'Conditional support; repeat as needed'],
            ['Check with practice', 'Less help, then review the evidence'],
            ['Complete every activity', 'Include written and teacher-led work'],
            ['Resume the journey', 'Server-owned progress and replay map'],
          ].map(([title, detail], i) => (
            <div
              key={title}
              className={styles.flowStep}
              aria-current={phaseIndex === i ? 'step' : undefined}
            >
              <span>{String(i + 1).padStart(2, '0')}</span>
              <div>
                <b>{title}</b>
                <small>{detail}</small>
              </div>
            </div>
          ))}
          <div className={styles.safeNote}>
            <ShieldCheck size={16} />
            <span>Silence and difficulty never count as understanding.</span>
          </div>
        </aside>
      </div>
      <div className={styles.teacherNote}>
        <b>Recorded success criteria</b>
        <p>{sample.evidence}</p>
        <small>
          This screen does not measure whether a real child meets the criteria.
        </small>
      </div>
    </section>
  )
}
