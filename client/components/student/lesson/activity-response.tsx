'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Volume2, Sparkles } from 'lucide-react'
import type { ActivityItem } from '@/services/curriculum-service'

export type ActivityResponsePhase =
  | 'teaching'
  | 'ready'
  | 'listening_mic'
  | 'evaluating'
  | 'conversation'
  | 'correct'
  | 'retry'
  | 'completed'

interface ActivityResponseProps {
  activity: ActivityItem
  phase: ActivityResponsePhase
  selected?: string
  submitting?: boolean
  seconds?: number
  conversationTurn?: number
  conversationComplete?: boolean
  onSelect: (value: string) => void
  onStartMic?: () => void
  onStopMic?: () => void
  onReplayModel?: (text: string) => void
  onEpisodeChange?: (text: string) => void
  onExpectedPhraseChange?: (text: string) => void
  onAdvanceActivity?: () => void
}

export function LessonStageRenderer({
  activity,
  phase,
  selected = '',
  submitting = false,
  conversationTurn = 0,
  onSelect,
  onStartMic,
  onStopMic,
  onReplayModel,
  onEpisodeChange,
  onExpectedPhraseChange,
  onAdvanceActivity,
}: ActivityResponseProps) {
  const stage = String(activity.stage || '').toUpperCase()
  const type = String(activity.type || '').toUpperCase()
  const disabled = submitting || phase === 'evaluating' || phase === 'listening_mic'

  switch (true) {
    case stage === 'WARM_UP' || type === 'LIKE_DISLIKE':
      return (
        <WarmUpActivityPanel
          activity={activity}
          phase={phase}
          disabled={disabled}
          selected={selected}
          onSelect={onSelect}
          onStartMic={onStartMic}
          onReplayModel={onReplayModel}
          onEpisodeChange={onEpisodeChange}
          onExpectedPhraseChange={onExpectedPhraseChange}
          onAdvanceActivity={onAdvanceActivity}
        />
      )

    case stage === 'LISTEN_REPEAT' || type === 'REPEAT_SENTENCE' || type === 'LISTEN_MODEL':
      return (
        <ListenRepeatActivityPanel
          activity={activity}
          phase={phase}
          disabled={disabled}
          onStartMic={onStartMic}
          onStopMic={onStopMic}
          onReplayModel={onReplayModel}
          onEpisodeChange={onEpisodeChange}
          onExpectedPhraseChange={onExpectedPhraseChange}
          onAdvanceActivity={onAdvanceActivity}
        />
      )

    case stage === 'PRACTICE_ZONE' || type === 'SENTENCE_BUILDER':
      return (
        <SentenceBuilderPanel
          activity={activity}
          phase={phase}
          disabled={disabled}
          onSelect={onSelect}
          onReplayModel={onReplayModel}
          onAdvanceActivity={onAdvanceActivity}
        />
      )

    case stage === 'RESPECT_DIFFERENCES' || type === 'LIKE_DISLIKE':
      return (
        <RespectDifferencesPanel
          activity={activity}
          selected={selected}
          disabled={disabled}
          onSelect={onSelect}
        />
      )

    case stage === 'SPEAK' || type === 'SPEAK_PROMPT' || (stage === 'FOLLOW_UP' && !activity.choices?.length):
      return (
        <GuidedSpeakStage
          activity={activity}
          selected={selected}
          disabled={disabled}
          onSelect={onSelect}
          onStartMic={onStartMic}
          onReplayModel={onReplayModel}
        />
      )

    case stage === 'FOLLOW_UP' || type === 'FOLLOW_UP_CONVERSATION':
      return (
        <FollowUpQuestionStage
          activity={activity}
          selected={selected}
          disabled={disabled}
          onSelect={onSelect}
          onStartMic={onStartMic}
          onReplayModel={onReplayModel}
        />
      )

    case type === 'INTERVIEW' || type === 'ASK_JULIE' || stage === 'INTERACT':
      return (
        <AskJulieStage
          activity={activity}
          selected={selected}
          disabled={disabled}
          onSelect={onSelect}
          onStartMic={onStartMic}
          onReplayModel={onReplayModel}
        />
      )

    case type === 'PICTURE_CHOICE' || type === 'VISUAL_CHOICE':
      return (
        <VisualChoiceStage
          activity={activity}
          selected={selected}
          disabled={disabled}
          onSelect={onSelect}
          onStartMic={onStartMic}
        />
      )

    case stage === 'FINAL_CHALLENGE' || stage === 'FINAL_TALK':
      return conversationTurn === 0 ? (
        <FinalChallengeIntroCard
          activity={activity}
          onStart={() => onSelect("I'm ready for our final chat, Miss Julie!")}
        />
      ) : (
        <IndependentConversationStage
          activity={activity}
          selected={selected}
          disabled={disabled}
          onSelect={onSelect}
          onStartMic={onStartMic}
        />
      )

    case stage === 'REWARD':
      return <RewardPanel activity={activity} onAdvanceActivity={onAdvanceActivity} />

    case ['OPEN_CONVERSATION', 'FINAL_CONVERSATION', 'ROLEPLAY', 'PRESENTATION', 'DESCRIBE_IMAGE'].includes(type):
      return (
        <IndependentConversationStage
          activity={activity}
          selected={selected}
          disabled={disabled}
          onSelect={onSelect}
          onStartMic={onStartMic}
        />
      )

    case ['SPEAK', 'INTERACT', 'REASONS', 'ROLEPLAY', 'PRESENT', 'BONUS', 'HOME_PRACTICE', 'FINAL_TALK'].includes(stage) ||
      ['OPEN_CONVERSATION', 'FOLLOW_UP_CONVERSATION', 'ROLEPLAY', 'INTERVIEW', 'PRESENTATION', 'DESCRIBE_IMAGE', 'FINAL_CONVERSATION'].includes(type):
      return (
        <StageExperienceCard
          activity={activity}
          phase={phase}
          selected={selected}
          disabled={disabled}
          onSelect={onSelect}
          onStartMic={onStartMic}
          onReplayModel={onReplayModel}
        />
      )

    default: {
      const choices = Array.isArray(activity.choices) ? activity.choices : []
      if (choices.length > 0) {
        return (
          <div className="talkora-suggestion-chips-panel">
            <span className="talkora-chips-label">💡 Ideas you can say or tap:</span>
            <div className="talkora-chips-row">
              {choices.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  className={`talkora-chip-btn ${selected === choice ? 'is-selected' : ''}`}
                  onClick={() => onSelect(choice)}
                  disabled={disabled}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>
        )
      }

      return null
    }
  }
}

export function ActivityResponse(props: ActivityResponseProps) {
  return <LessonStageRenderer {...props} />
}

function VisualChoiceStage({
  activity,
  selected,
  disabled,
  onSelect,
  onStartMic,
}: {
  activity: ActivityItem
  selected: string
  disabled: boolean
  onSelect: (value: string) => void
  onStartMic?: () => void
}) {
  const items = Array.isArray(activity.choices) && activity.choices.length
    ? activity.choices
    : ['Cricket', 'Reading books', 'Cake', 'Singing', 'Running races', 'Red chilli']

  return (
    <div className="talkora-card-panel" style={{ background: 'linear-gradient(135deg, rgba(251,146,60,0.18), rgba(15,23,42,0.9))', border: '2px solid rgba(251,146,60,0.9)', boxShadow: '0 18px 35px rgba(251,146,60,0.18)' }}>
      <div className="talkora-panel-header">
        <div className="talkora-panel-badge-row">
          <span className="talkora-stage-pill" style={{ background: '#fbbf24', color: '#0f172a' }}>VISUAL CHOICE</span>
        </div>
        <h2 className="talkora-panel-title" style={{ color: '#ffffff' }}>Choose your favourite</h2>
        <p className="talkora-panel-subtitle" style={{ color: 'rgba(255,255,255,0.8)' }}>Tap the one you love most. Then tell Julie in a full sentence.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 16 }}>
        {items.map((item) => (
          <motion.button
            key={item}
            type="button"
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="talkora-chip-btn"
            onClick={() => onSelect(item)}
            disabled={disabled}
            style={{
              minHeight: 110,
              borderRadius: 18,
              background: selected === item ? 'linear-gradient(135deg, #fde68a, #f59e0b)' : 'rgba(255,255,255,0.08)',
              color: selected === item ? '#11213d' : '#f8fafc',
              border: selected === item ? '2px solid rgba(17,33,61,0.25)' : '1px solid rgba(255,255,255,0.12)',
              boxShadow: selected === item ? '0 12px 24px rgba(245,158,11,0.3)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
            }}
          >
            {item}
          </motion.button>
        ))}
      </div>

      {onStartMic && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
          <button type="button" className="talkora-final-start-btn" onClick={onStartMic} style={{ background: '#fbbf24', color: '#0f172a' }}>
            🎤 Say it now
          </button>
        </div>
      )}
    </div>
  )
}

function GuidedSpeakStage({
  activity,
  selected,
  disabled,
  onSelect,
  onStartMic,
  onReplayModel,
}: {
  activity: ActivityItem
  selected: string
  disabled: boolean
  onSelect: (value: string) => void
  onStartMic?: () => void
  onReplayModel?: (text: string) => void
}) {
  const target = activity.modelSentence || activity.target || 'My favourite sport is cricket.'
  const chunks = target.split(/\s+/)
  const phrase = selected || activity.prompt || 'I like cricket.'

  return (
    <div className="talkora-card-panel" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.14), rgba(15,23,42,0.92))', border: '2px solid rgba(74,222,128,0.75)', boxShadow: '0 18px 35px rgba(34,197,94,0.16)' }}>
      <div className="talkora-panel-header">
        <div className="talkora-panel-badge-row">
          <span className="talkora-stage-pill" style={{ background: '#a7f3d0', color: '#0f172a' }}>GUIDED SPEAK</span>
        </div>
        <h2 className="talkora-panel-title" style={{ color: '#ffffff' }}>Build the sentence</h2>
        <p className="talkora-panel-subtitle" style={{ color: 'rgba(255,255,255,0.8)' }}>Say one part at a time, then the whole sentence.</p>
      </div>

      <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
        <div style={{ padding: 12, borderRadius: 14, background: 'rgba(15,23,42,0.35)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ color: '#86efac', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 800 }}>Model</div>
          <div style={{ color: '#ffffff', fontSize: 18, fontWeight: 800, marginTop: 6 }}>{target}</div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {chunks.map((chunk, index) => (
            <motion.span key={`${chunk}-${index}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ borderRadius: 999, padding: '7px 10px', background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)', color: '#f8fafc', fontWeight: 700 }}>
              {chunk}
            </motion.span>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="talkora-chip-btn" onClick={() => onSelect(phrase)} disabled={disabled} style={{ background: 'rgba(255,255,255,0.10)', color: '#ffffff' }}>
            {phrase}
          </button>
          {onReplayModel && (
            <button type="button" className="talkora-model-replay-btn" onClick={() => onReplayModel(target)}>
              🔊 Listen again
            </button>
          )}
          {onStartMic && (
            <button type="button" className="talkora-final-start-btn" onClick={onStartMic} style={{ background: '#a7f3d0', color: '#0f172a' }}>
              🎤 Speak now
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function FollowUpQuestionStage({
  activity,
  selected,
  disabled,
  onSelect,
  onStartMic,
  onReplayModel,
}: {
  activity: ActivityItem
  selected: string
  disabled: boolean
  onSelect: (value: string) => void
  onStartMic?: () => void
  onReplayModel?: (text: string) => void
}) {
  const questions = [
    'Who do you play cricket with?',
    'Why do you like cricket?',
    'What is your favourite subject?',
  ]
  const prompt = activity.prompt || 'Ask Miss Julie a follow-up question.'

  return (
    <div className="talkora-card-panel" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(15,23,42,0.92))', border: '2px solid rgba(196,181,253,0.8)', boxShadow: '0 18px 35px rgba(139,92,246,0.18)' }}>
      <div className="talkora-panel-header">
        <div className="talkora-panel-badge-row">
          <span className="talkora-stage-pill" style={{ background: '#c4b5fd', color: '#0f172a' }}>FOLLOW-UP</span>
        </div>
        <h2 className="talkora-panel-title" style={{ color: '#ffffff' }}>Ask a follow-up question</h2>
        <p className="talkora-panel-subtitle" style={{ color: 'rgba(255,255,255,0.8)' }}>{prompt}</p>
      </div>

      <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
        {questions.map((item) => (
          <button key={item} type="button" className="talkora-chip-btn" onClick={() => onSelect(item)} disabled={disabled} style={{ background: selected === item ? '#c4b5fd' : 'rgba(255,255,255,0.08)', color: selected === item ? '#0f172a' : '#ffffff', fontWeight: 700 }}>
            {item}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
        {onReplayModel && (
          <button type="button" className="talkora-model-replay-btn" onClick={() => onReplayModel('Who do you play cricket with?')}>
            🔊 Hear the model question
          </button>
        )}
        {onStartMic && (
          <button type="button" className="talkora-final-start-btn" onClick={onStartMic} style={{ background: '#c4b5fd', color: '#0f172a' }}>
            🎤 Ask it now
          </button>
        )}
      </div>
    </div>
  )
}

function AskJulieStage({
  activity,
  selected,
  disabled,
  onSelect,
  onStartMic,
  onReplayModel,
}: {
  activity: ActivityItem
  selected: string
  disabled: boolean
  onSelect: (value: string) => void
  onStartMic?: () => void
  onReplayModel?: (text: string) => void
}) {
  const prompt = activity.prompt || 'Ask Miss Julie: What is your favourite sport?'
  const options = ['What is your favourite sport?', 'What is your favourite food?', 'What do you like best at school?']

  return (
    <div className="talkora-card-panel" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(15,23,42,0.92))', border: '2px solid rgba(96,165,250,0.8)', boxShadow: '0 18px 35px rgba(59,130,246,0.18)' }}>
      <div className="talkora-panel-header">
        <div className="talkora-panel-badge-row">
          <span className="talkora-stage-pill" style={{ background: '#93c5fd', color: '#0f172a' }}>ASK JULIE</span>
        </div>
        <h2 className="talkora-panel-title" style={{ color: '#ffffff' }}>Your turn to interview Miss Julie</h2>
        <p className="talkora-panel-subtitle" style={{ color: 'rgba(255,255,255,0.8)' }}>{prompt}</p>
      </div>

      <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
        {options.map((item) => (
          <button key={item} type="button" className="talkora-chip-btn" onClick={() => onSelect(item)} disabled={disabled} style={{ background: selected === item ? '#93c5fd' : 'rgba(255,255,255,0.08)', color: selected === item ? '#0f172a' : '#ffffff', fontWeight: 700 }}>
            {item}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
        {onReplayModel && (
          <button type="button" className="talkora-model-replay-btn" onClick={() => onReplayModel('What is your favourite sport?')}>
            🔊 Model question
          </button>
        )}
        {onStartMic && (
          <button type="button" className="talkora-final-start-btn" onClick={onStartMic} style={{ background: '#93c5fd', color: '#0f172a' }}>
            🎤 Ask now
          </button>
        )}
      </div>
    </div>
  )
}

function IndependentConversationStage({
  activity,
  selected,
  disabled,
  onSelect,
  onStartMic,
}: {
  activity: ActivityItem
  selected: string
  disabled: boolean
  onSelect: (value: string) => void
  onStartMic?: () => void
}) {
  const goals = [
    'Favourite ✓',
    'Reason ✓',
    'Follow-up ○',
    'Ask Julie ○',
    'Compare ○',
  ]

  return (
    <div className="talkora-card-panel" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.18), rgba(15,23,42,0.92))', border: '2px solid rgba(196,181,253,0.85)', boxShadow: '0 18px 35px rgba(168,85,247,0.16)' }}>
      <div className="talkora-panel-header">
        <div className="talkora-panel-badge-row">
          <span className="talkora-stage-pill" style={{ background: '#c4b5fd', color: '#0f172a' }}>CONVERSATION</span>
        </div>
        <h2 className="talkora-panel-title" style={{ color: '#ffffff' }}>Keep the conversation going</h2>
        <p className="talkora-panel-subtitle" style={{ color: 'rgba(255,255,255,0.8)' }}>{activity.prompt || 'Share your favourite, give a reason, and ask a follow-up question.'}</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {goals.map((goal) => (
          <span key={goal} style={{ padding: '8px 10px', borderRadius: 999, background: goal.includes('✓') ? 'rgba(134,239,172,0.18)' : 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#ffffff', fontWeight: 700 }}>
            {goal}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
        <button type="button" className="talkora-chip-btn" onClick={() => onSelect('I like cricket because it is exciting.')} style={{ background: 'rgba(255,255,255,0.08)', color: '#ffffff' }}>
          I like cricket because it is exciting.
        </button>
        {onStartMic && (
          <button type="button" className="talkora-final-start-btn" onClick={onStartMic} style={{ background: '#c4b5fd', color: '#0f172a' }}>
            🎤 Speak naturally
          </button>
        )}
      </div>
    </div>
  )
}

function StageExperienceCard({
  activity,
  phase,
  selected,
  disabled,
  onSelect,
  onStartMic,
  onReplayModel,
}: {
  activity: ActivityItem
  phase: ActivityResponsePhase
  selected: string
  disabled: boolean
  onSelect: (value: string) => void
  onStartMic?: () => void
  onReplayModel?: (text: string) => void
}) {
  const stage = String(activity.stage || '').toUpperCase()
  const type = String(activity.type || '').toUpperCase()
  const choices = Array.isArray(activity.choices) ? activity.choices : []
  const theme = getStageTheme(stage, type)
  const helperText = activity.instruction || activity.prompt || 'Say your answer with confidence.'

  return (
    <div
      className="talkora-card-panel"
      style={{
        background: `linear-gradient(135deg, ${theme.glow} 0%, rgba(15,23,42,0.92) 100%)`,
        border: `2px solid ${theme.accent}`,
        boxShadow: `0 18px 35px ${theme.shadow}`,
      }}
    >
      <div className="talkora-panel-header" style={{ marginBottom: 10 }}>
        <div className="talkora-panel-badge-row">
          <span className="talkora-stage-pill" style={{ background: theme.accent, color: '#0f172a' }}>{theme.badge}</span>
        </div>
        <h2 className="talkora-panel-title" style={{ color: '#ffffff' }}>{theme.title}</h2>
        <p className="talkora-panel-subtitle" style={{ color: 'rgba(255,255,255,0.78)' }}>{helperText}</p>
      </div>

      <div style={{ display: 'grid', gap: 12, marginTop: 8 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px',
          borderRadius: 14,
          background: 'rgba(15, 23, 42, 0.38)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: '#f8fafc',
          fontSize: 14,
          fontWeight: 700,
        }}>
          <span>Try this idea</span>
          <strong style={{ color: theme.accent }}>{activity.target || activity.modelSentence || 'Use a full sentence.'}</strong>
        </div>

        {choices.length > 0 && (
          <div className="talkora-chips-row" style={{ justifyContent: 'flex-start' }}>
            {choices.map((choice) => (
              <button
                key={choice}
                type="button"
                className={`talkora-chip-btn ${selected === choice ? 'is-selected' : ''}`}
                onClick={() => onSelect(choice)}
                disabled={disabled}
                style={{ background: selected === choice ? theme.accent : 'rgba(255,255,255,0.10)', color: '#ffffff' }}
              >
                {choice}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {onStartMic && (
            <button type="button" className="talkora-final-start-btn" onClick={onStartMic} style={{ background: theme.accent, color: '#0f172a' }}>
              🎤 Speak now
            </button>
          )}
          {onReplayModel && activity.target && (
            <button type="button" className="talkora-model-replay-btn" onClick={() => onReplayModel(activity.target || helperText)}>
              🔊 Listen again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function getStageTheme(stage: string, type: string) {
  const map: Record<string, { badge: string; title: string; accent: string; glow: string; shadow: string }> = {
    SPEAK: { badge: 'SPEAK', title: 'Share your answer', accent: '#a7f3d0', glow: 'rgba(34,197,94,0.20)', shadow: 'rgba(34,197,94,0.20)' },
    INTERACT: { badge: 'INTERACT', title: 'Have a conversation', accent: '#fbbf24', glow: 'rgba(234,179,8,0.22)', shadow: 'rgba(234,179,8,0.20)' },
    FOLLOW_UP: { badge: 'FOLLOW-UP', title: 'Ask a follow-up', accent: '#c4b5fd', glow: 'rgba(139,92,246,0.20)', shadow: 'rgba(139,92,246,0.20)' },
    REASONS: { badge: 'REASONS', title: 'Give a reason', accent: '#f9a8d4', glow: 'rgba(244,114,182,0.18)', shadow: 'rgba(244,114,182,0.20)' },
    ROLEPLAY: { badge: 'ROLEPLAY', title: 'Act it out', accent: '#93c5fd', glow: 'rgba(59,130,246,0.18)', shadow: 'rgba(59,130,246,0.20)' },
    PRESENT: { badge: 'PRESENT', title: 'Present your idea', accent: '#fca5a5', glow: 'rgba(239,68,68,0.16)', shadow: 'rgba(239,68,68,0.20)' },
    BONUS: { badge: 'BONUS', title: 'Bonus challenge', accent: '#86efac', glow: 'rgba(22,163,74,0.18)', shadow: 'rgba(22,163,74,0.20)' },
    HOME_PRACTICE: { badge: 'HOME', title: 'Home practice', accent: '#7dd3fc', glow: 'rgba(14,165,233,0.18)', shadow: 'rgba(14,165,233,0.20)' },
    FINAL_TALK: { badge: 'FINAL TALK', title: 'Final challenge', accent: '#fde68a', glow: 'rgba(250,204,21,0.22)', shadow: 'rgba(250,204,21,0.20)' },
    OPEN_CONVERSATION: { badge: 'CHAT', title: 'Keep the conversation going', accent: '#c4b5fd', glow: 'rgba(168,85,247,0.18)', shadow: 'rgba(168,85,247,0.20)' },
    FOLLOW_UP_CONVERSATION: { badge: 'QUESTION', title: 'Ask and respond', accent: '#93c5fd', glow: 'rgba(37,99,235,0.18)', shadow: 'rgba(37,99,235,0.20)' },
    PRESENTATION: { badge: 'PRESENT', title: 'Share your speaking', accent: '#fca5a5', glow: 'rgba(251,146,60,0.14)', shadow: 'rgba(251,146,60,0.20)' },
    FINAL_CONVERSATION: { badge: 'FINAL', title: 'Final conversation', accent: '#fde68a', glow: 'rgba(250,204,21,0.20)', shadow: 'rgba(250,204,21,0.20)' },
  }

  return map[stage] || map[type] || {
    badge: 'SPEAK',
    title: 'Keep speaking',
    accent: '#a7f3d0',
    glow: 'rgba(34,197,94,0.20)',
    shadow: 'rgba(34,197,94,0.20)',
  }
}

/* =========================================================
   SUB-PANEL 1: WARM-UP (Page 12 — ALL 6 SOURCE ITEMS)
   ========================================================= */
const ALL_SIX_WARMUP_ITEMS = [
  { id: 'cricket', label: 'Cricket', icon: '🏏', text: 'playing cricket' },
  { id: 'chilli', label: 'Red Chilli', icon: '🌶️', text: 'eating red chilli' },
  { id: 'homework', label: 'Homework', icon: '📝', text: 'doing homework' },
  { id: 'singing', label: 'Singing', icon: '🎤', text: 'singing' },
  { id: 'cake', label: 'Cake', icon: '🎂', text: 'eating cake' },
  { id: 'races', label: 'Running Races', icon: '🏃', text: 'running races' },
]

function WarmUpActivityPanel({
  phase,
  selected,
  disabled,
  onSelect,
  onStartMic,
  onReplayModel,
  onEpisodeChange,
  onExpectedPhraseChange,
  onAdvanceActivity,
}: {
  activity: ActivityItem
  phase: ActivityResponsePhase
  selected: string
  disabled: boolean
  onSelect: (val: string) => void
  onStartMic?: () => void
  onReplayModel?: (text: string) => void
  onEpisodeChange?: (text: string) => void
  onExpectedPhraseChange?: (text: string) => void
  onAdvanceActivity?: () => void
}) {
  const [activeItemIndex, setActiveItemIndex] = useState(0)
  const [answeredIndex, setAnsweredIndex] = useState<number | null>(null)
  const [preference, setPreference] = useState<boolean | null>(null)
  const currentItem = ALL_SIX_WARMUP_ITEMS[activeItemIndex] || ALL_SIX_WARMUP_ITEMS[0]

  function handleChoice(like: boolean) {
    const text = like
      ? `I like ${currentItem?.text || 'this'}.`
      : `I don't like ${currentItem?.text || 'this'}.`
    setAnsweredIndex(activeItemIndex)
    setPreference(like)
    onExpectedPhraseChange?.(text)
    const scaffold = activeItemIndex === 0
      ? `Aha! Then say: ${text}`
      : activeItemIndex === 1
        ? `Start with: I ${like ? 'like' : "don't like"}...`
        : activeItemIndex === 2
          ? 'Tell me in a whole sentence.'
          : 'What do you think? Make the sentence yourself!'
    onEpisodeChange?.(scaffold)
  }

  function handleNextItem() {
    if (activeItemIndex < ALL_SIX_WARMUP_ITEMS.length - 1) {
      const nextIdx = activeItemIndex + 1
      setActiveItemIndex(nextIdx)
      setAnsweredIndex(null)
      setPreference(null)
      onExpectedPhraseChange?.('')
      onSelect('')
      const nextItem = ALL_SIX_WARMUP_ITEMS[nextIdx]
      if (nextItem) {
        onEpisodeChange?.(`Do you like ${nextItem.text}?`)
      }
    } else {
      onAdvanceActivity?.()
    }
  }

  const isCurrentAnswered = answeredIndex === activeItemIndex && phase === 'correct'

  return (
    <div className="talkora-card-panel talkora-warmup-panel">
      <div className="talkora-panel-header">
        <div className="talkora-panel-badge-row">
          <span className="talkora-stage-pill">WARM-UP</span>
          <span className="talkora-counter-pill">
            Item {activeItemIndex + 1} of {ALL_SIX_WARMUP_ITEMS.length}
          </span>
        </div>
        <h2 className="talkora-panel-title">
          Do you like <strong>{currentItem.text}</strong>?
        </h2>
        <p className="talkora-panel-subtitle">
          Choose what is true for you, then say it in a whole sentence.
        </p>
      </div>

      {preference !== null && (
        <motion.div className="talkora-speaking-step" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <span className="talkora-speaking-step__label">
            {activeItemIndex === 0 ? 'LISTEN & COPY' : activeItemIndex === 1 ? 'FINISH THE SENTENCE' : activeItemIndex === 2 ? 'WHOLE SENTENCE' : 'MAKE IT YOURSELF'}
          </span>
          {activeItemIndex < 2 && <strong>{preference ? `I like ${currentItem.text}.` : `I don't like ${currentItem.text}.`}</strong>}
          <span className="talkora-speaking-step__dock-cue">Use the big microphone below when you are ready.</span>
        </motion.div>
      )}

      <div className="talkora-warmup-focus" aria-label={currentItem.label}>
        <span className="talkora-warmup-focus__art">{currentItem.icon}</span>
        <strong>{currentItem.label}</strong>
        <span>{activeItemIndex + 1} of {ALL_SIX_WARMUP_ITEMS.length}</span>
      </div>
      <div className="talkora-warmup-dots" aria-label="Warm-up progress">
        {ALL_SIX_WARMUP_ITEMS.map((item, idx) => (
          <span key={item.id} className={idx === activeItemIndex ? 'is-current' : idx < activeItemIndex ? 'is-done' : ''} />
        ))}
      </div>

      {/* LIKE / DON'T LIKE FULL SENTENCE BUTTONS */}
      <div className="talkora-warmup-actions">
        <button
          type="button"
          className={`talkora-like-btn is-like ${preference === true ? 'is-selected' : ''}`}
          onClick={() => handleChoice(true)}
          disabled={disabled}
        >
          <span className="talkora-like-btn__emoji">👍</span>
          <div>
            <strong>I like it</strong>
            <small>&ldquo;I like {currentItem.text}.&rdquo;</small>
          </div>
        </button>

        <button
          type="button"
          className={`talkora-like-btn is-dislike ${preference === false ? 'is-selected' : ''}`}
          onClick={() => handleChoice(false)}
          disabled={disabled}
        >
          <span className="talkora-like-btn__emoji">👎</span>
          <div>
            <strong>I don&apos;t like it</strong>
            <small>&ldquo;I don&apos;t like {currentItem.text}.&rdquo;</small>
          </div>
        </button>
      </div>

      {/* NEXT STEP ADVANCE BUTTON */}
      {isCurrentAnswered && (
        <motion.div
          className="talkora-warmup-advance-row"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            type="button"
            className="talkora-warmup-next-btn"
            onClick={handleNextItem}
          >
            {activeItemIndex < ALL_SIX_WARMUP_ITEMS.length - 1 ? 'NEXT ITEM →' : 'FINISH WARM-UP →'}
          </button>
        </motion.div>
      )}
    </div>
  )
}

/* =========================================================
   SUB-PANEL 2: LISTEN & REPEAT (Page 13 Dialogue Sequence)
   ========================================================= */
const PAGE_13_DIALOGUE = [
  { role: 'teacher', speaker: 'Miss Julie', text: 'Hi! What is your name?' },
  { role: 'student', speaker: 'Preethi', text: 'My name is Preethi. What is your name?' },
  { role: 'teacher', speaker: 'Sunny', text: 'My name is Sunny.' },
  { role: 'student', speaker: 'Preethi', text: 'Hi Sunny! What is your favourite food?' },
  { role: 'teacher', speaker: 'Sunny', text: 'My favourite food is noodles. What food do you like?' },
  { role: 'student', speaker: 'Preethi', text: 'I like pizza the best. What is your favourite sport?' },
  { role: 'teacher', speaker: 'Sunny', text: 'My favourite sport is cricket. What is your favourite sport?' },
  { role: 'student', speaker: 'Preethi', text: 'I like badminton. Which school subject do you like the most?' },
  { role: 'teacher', speaker: 'Sunny', text: 'I like English the most. Which school subject do you like the most?' },
  { role: 'student', speaker: 'Preethi', text: 'I like Maths the most.' },
]

function ListenRepeatActivityPanel({
  activity,
  phase,
  disabled,
  onStartMic,
  onStopMic,
  onReplayModel,
  onEpisodeChange,
  onExpectedPhraseChange,
  onAdvanceActivity,
}: {
  activity: ActivityItem
  phase: ActivityResponsePhase
  disabled: boolean
  onStartMic?: () => void
  onStopMic?: () => void
  onReplayModel?: (text: string) => void
  onEpisodeChange?: (text: string) => void
  onExpectedPhraseChange?: (text: string) => void
  onAdvanceActivity?: () => void
}) {
  const [turnIndex, setTurnIndex] = useState(0)
  const [heardLines, setHeardLines] = useState<Set<number>>(new Set())
  const [attempt, setAttempt] = useState(1)
  const sourceTurns = Array.isArray(activity.content?.dialogueTurns) ? activity.content.dialogueTurns : []
  const dialogue: Array<{
    id?: string
    role?: string
    speaker: string
    text: string
    julieText?: string
    julieAnswer?: string
  }> = sourceTurns.length
      ? sourceTurns.flatMap((turn) => {
        if (typeof turn === 'string') return [{ speaker: 'Miss Julie', text: turn }]
        if (turn && typeof turn === 'object' && 'text' in turn && typeof turn.text === 'string') {
          const role = 'role' in turn ? String(turn.role) : 'missJulie'
          return [{
            id: 'id' in turn ? String(turn.id) : String(turn.text),
            role,
            speaker: role === 'modelStudent' || role === 'answer' ? 'Model learner' : 'Miss Julie',
            text: turn.text,
            julieText: 'julieText' in turn ? String(turn.julieText) : undefined,
            julieAnswer: 'julieAnswer' in turn ? String(turn.julieAnswer) : undefined,
          }]
        }
        return []
      })
      : PAGE_13_DIALOGUE
  const currentLine = dialogue[turnIndex] || dialogue[0]!
  const listenOnly = activity.type === 'LISTEN_MODEL' || activity.metadata?.listenOnly === true

  React.useEffect(() => {
    onExpectedPhraseChange?.(currentLine.text)
  }, [currentLine.text, onExpectedPhraseChange])

  React.useEffect(() => {
    setHeardLines((previous) => new Set(previous).add(turnIndex))
    setAttempt(1)
  }, [turnIndex])

  React.useEffect(() => {
    if (phase === 'retry') setAttempt((value) => Math.min(5, value + 1))
  }, [phase])

  function handleNextLine() {
    if (turnIndex < dialogue.length - 1) {
      setTurnIndex((prev) => prev + 1)
      const nextLine = dialogue[turnIndex + 1]
      if (nextLine) {
        const lead = !listenOnly && nextLine.julieText ? `${nextLine.julieText} ${nextLine.text}` : nextLine.text
        onEpisodeChange?.(lead)
      }
    } else {
      onAdvanceActivity?.()
    }
  }

  return (
    <div className="talkora-card-panel talkora-listen-repeat-panel">
      <div className="talkora-panel-header">
        <div className="talkora-panel-badge-row">
          <span className="talkora-stage-pill">{listenOnly ? 'LISTEN' : 'YOUR TURN'}</span>
          <span className="talkora-counter-pill">Line {turnIndex + 1} of {dialogue.length}</span>
        </div>
        <h2 className="talkora-panel-title">{listenOnly ? 'Watch how the conversation takes turns' : currentLine.role === 'ask' ? 'Now you ask Miss Julie!' : 'Your turn to answer'}</h2>
      </div>

      {!listenOnly && currentLine.julieText && <div className="talkora-turn-cue"><b>LISTEN TO JULIE</b><span>{currentLine.julieText}</span><i>↓</i><b>YOUR TURN</b></div>}

      <div className="talkora-model-sentence-box">
        <div className="talkora-model-speaker-label">
          <Volume2 size={16} />
          <span>{listenOnly ? currentLine.speaker : 'Model'}:</span>
        </div>
        <p className="talkora-model-text">&ldquo;{currentLine.text}&rdquo;</p>
        <button
          type="button"
          className="talkora-model-replay-btn"
          onClick={() => onReplayModel?.(currentLine.text)}
        >
          🔊 Listen Again
        </button>
      </div>

      {!listenOnly && attempt >= 3 && (
        <div className="talkora-chunk-support">
          {currentLine.text.includes(' is ') ? currentLine.text.split(' is ').map((chunk: string, index: number) => <span key={chunk}>{chunk}{index === 0 ? ' ↓' : ''}</span>) : <span>{currentLine.text}</span>}
          <small>{attempt >= 5 ? 'Supported repeat — say it with Julie and keep going.' : 'Say one chunk at a time.'}</small>
        </div>
      )}

      {/* Waveform indicator */}
      <div className="talkora-waveform-box" aria-hidden="true">
        {[40, 75, 55, 90, 60, 85, 45, 95, 70, 50, 80, 65].map((h, i) => (
          <span
            key={i}
            className="talkora-wave-bar"
            style={{ height: `${phase === 'listening_mic' ? h : 20}%` }}
          />
        ))}
      </div>

      <div className="talkora-repeat-actions">
        {listenOnly ? (
          <button type="button" className="talkora-repeat-next-line-btn" onClick={handleNextLine}>
            {turnIndex < dialogue.length - 1 ? 'I HEARD IT — NEXT →' : heardLines.size >= dialogue.length ? 'CONTINUE →' : 'HEAR THE LAST LINE'}
          </button>
        ) : <>
          <p className="talkora-speaking-step__dock-cue">Use the big microphone below to say this line.</p>

          {phase === 'correct' && (
            <button
              type="button"
              className="talkora-repeat-next-line-btn"
              onClick={() => {
                if (currentLine.julieAnswer) onReplayModel?.(`${currentLine.julieAnswer} Ooh, you asked me the question this time!`)
                handleNextLine()
              }}
            >
              {turnIndex < dialogue.length - 1 ? 'NEXT →' : 'CONTINUE →'}
            </button>
          )}
        </>}
      </div>
    </div>
  )
}

/* =========================================================
   SUB-PANEL 3: SENTENCE BUILDER (Pages 15, 20 Practice Zone)
   ========================================================= */
const DEFAULT_TOKENS = ['My', 'favourite', 'sport', 'is', 'cricket', '.']

function SentenceBuilderPanel({
  phase,
  disabled,
  onSelect,
  onReplayModel,
  onAdvanceActivity,
}: {
  activity: ActivityItem
  phase: ActivityResponsePhase
  disabled: boolean
  onSelect: (val: string) => void
  onReplayModel?: (text: string) => void
  onAdvanceActivity?: () => void
}) {
  const [placedTokens, setPlacedTokens] = useState<string[]>([])
  const [bankTokens, setBankTokens] = useState<string[]>(DEFAULT_TOKENS)
  const [isSuccess, setIsSuccess] = useState(false)

  function addToken(token: string, idx: number) {
    setPlacedTokens((prev) => [...prev, token])
    setBankTokens((prev) => prev.filter((_, i) => i !== idx))
  }

  function removeToken(token: string, idx: number) {
    setPlacedTokens((prev) => prev.filter((_, i) => i !== idx))
    setBankTokens((prev) => [...prev, token])
  }

  function handleCheck() {
    const constructed = placedTokens.join(' ').replace(/\s+\./, '.')
    if (constructed === 'My favourite sport is cricket.') {
      setIsSuccess(true)
      onReplayModel?.(constructed)
      onSelect(constructed)
    }
  }

  return (
    <div className="talkora-card-panel talkora-builder-panel">
      <div className="talkora-panel-header">
        <div className="talkora-panel-badge-row">
          <span className="talkora-stage-pill">PRACTICE ZONE</span>
        </div>
        <h2 className="talkora-panel-title">Build the Sentence</h2>
        <p className="talkora-panel-subtitle">Tap the word tiles in order to make a complete answer.</p>
      </div>

      <div className="talkora-builder-slot">
        {placedTokens.length === 0 ? (
          <span className="talkora-slot-placeholder">Tap words below to place them here...</span>
        ) : (
          placedTokens.map((token, i) => (
            <button
              key={i}
              type="button"
              className="talkora-placed-chip"
              onClick={() => removeToken(token, i)}
            >
              {token}
            </button>
          ))
        )}
      </div>

      <div className="talkora-builder-bank">
        {bankTokens.map((token, i) => (
          <button
            key={i}
            type="button"
            className="talkora-bank-chip"
            onClick={() => addToken(token, i)}
            disabled={disabled}
          >
            {token}
          </button>
        ))}
      </div>

      <div className="talkora-builder-footer">
        <button
          type="button"
          className="talkora-builder-check-btn"
          onClick={handleCheck}
          disabled={placedTokens.length === 0 || disabled}
        >
          Check Sentence ✓
        </button>

        {isSuccess && (
          <button
            type="button"
            className="talkora-builder-continue-btn"
            onClick={onAdvanceActivity}
          >
            CONTINUE →
          </button>
        )}
      </div>
    </div>
  )
}

/* =========================================================
   SUB-PANEL 4: RESPECT DIFFERENCES (Pages 21–23)
   ========================================================= */
function RespectDifferencesPanel({
  selected,
  disabled,
  onSelect,
}: {
  activity: ActivityItem
  selected: string
  disabled: boolean
  onSelect: (val: string) => void
}) {
  const options = [
    { title: 'We both like it!', text: 'We both like lions.', emoji: '🤝' },
    { title: 'Different Favourites', text: 'You like the park, and I like the library.', emoji: '✨' },
    { title: 'Polite Agreement', text: 'We have different favourites, and that is okay.', emoji: '💬' },
  ]

  return (
    <div className="talkora-card-panel talkora-respect-panel">
      <div className="talkora-panel-header">
        <div className="talkora-panel-badge-row">
          <span className="talkora-stage-pill">PAGES 21–23 RESPECT DIFFERENCES</span>
        </div>
        <h2 className="talkora-panel-title">Polite Conversational Phrases</h2>
        <p className="talkora-panel-subtitle">Practise what to say when you and Miss Julie have same or different favourites.</p>
      </div>

      <div className="talkora-respect-grid">
        {options.map((opt) => (
          <button
            key={opt.title}
            type="button"
            className={`talkora-respect-card ${selected === opt.text ? 'is-selected' : ''}`}
            onClick={() => onSelect(opt.text)}
            disabled={disabled}
          >
            <span className="talkora-respect-emoji">{opt.emoji}</span>
            <div className="talkora-respect-content">
              <strong>{opt.title}</strong>
              <p>&ldquo;{opt.text}&rdquo;</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

/* =========================================================
   SUB-PANEL 5: FINAL CHALLENGE (Page 24)
   ========================================================= */
function FinalChallengeIntroCard({
  onStart,
}: {
  activity: ActivityItem
  onStart: () => void
}) {
  return (
    <div className="talkora-card-panel talkora-final-challenge-card">
      <div className="talkora-panel-header">
        <div className="talkora-panel-badge-row">
          <span className="talkora-stage-pill">FINAL CHALLENGE</span>
        </div>
        <h2 className="talkora-panel-title">Ready for Your Final English Talk?</h2>
        <p className="talkora-panel-subtitle">Demonstrate all the speaking skills you practiced with Miss Julie!</p>
      </div>

      <div className="talkora-challenge-checklist">
        <div className="talkora-challenge-item"><Check size={18} className="text-green-400" /><span>Answer in full sentences</span></div>
        <div className="talkora-challenge-item"><Check size={18} className="text-green-400" /><span>Ask follow-up questions to learn more</span></div>
        <div className="talkora-challenge-item"><Check size={18} className="text-green-400" /><span>Give reasons using &ldquo;because&rdquo;</span></div>
        <div className="talkora-challenge-item"><Check size={18} className="text-green-400" /><span>Speak politely when favourites differ</span></div>
      </div>

      <button
        type="button"
        className="talkora-final-start-btn"
        onClick={onStart}
      >
        <Sparkles size={18} />
        <span>START FINAL TALK WITH MISS JULIE →</span>
      </button>
    </div>
  )
}

function RewardPanel({
  activity,
  onAdvanceActivity,
}: {
  activity: ActivityItem
  onAdvanceActivity?: () => void
}) {
  return (
    <div className="talkora-card-panel talkora-reward-preview">
      <span className="talkora-stage-pill">REFLECTION</span>
      <h2 className="talkora-panel-title">Your Favourite Finder badge is ready!</h2>
      <p className="talkora-panel-subtitle">{activity.prompt || 'Celebrate the English conversation skills you demonstrated.'}</p>
      <button type="button" className="talkora-final-start-btn" onClick={onAdvanceActivity}>
        <Sparkles size={18} />
        <span>REVEAL MY REWARD</span>
      </button>
    </div>
  )
}
