'use client'
import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { LevelDesignConfig, LevelActivity, LevelInteractionConfig, SuggestedActivity } from './types'
import styles from './level-studio.module.css'

/** Staff design preview only: no fake microphone scores, API calls, or student progression. */
export function LevelDraftPreview({config,activities,suggestedActivities,interactions}:{config:LevelDesignConfig;activities:LevelActivity[];suggestedActivities:SuggestedActivity[];interactions:LevelInteractionConfig}) {
  const [selected,setSelected] = useState(0)
  const color = config.experience.palette
  const vars = {'--studio-bg':color.background,'--studio-bg-deep':color.backgroundDeep,'--studio-primary':color.primary,'--studio-secondary':color.secondary,'--studio-accent':color.accent,'--studio-ink':color.ink} as CSSProperties
  const options = suggestedActivities.length ? suggestedActivities : [{label:'Draft the first activity',mode:interactions.allowedModes[0],educatorNote:'Open activities.ts to begin.'}]
  const active = options[selected % options.length]
  const shapes:Record<string,string> = {flower:'✿',compass:'✦',wave:'〰',star:'✧',castle:'♜',rainbow:'◡',shop:'▤',note:'♫',tree:'♧',confetti:'✳'}
  return <div className={styles.shell} style={vars}>
    <div className={styles.topline}><span>TEACHER DESIGN PREVIEW</span><strong>{config.id.toUpperCase()}</strong><span>{config.editorialStatus==='draft'?'DRAFT · NOT PLAYABLE':'EXISTING LESSON · DO NOT REPLACE'}</span></div>
    <div className={styles.stage} data-layout={config.experience.layout}>
      <div className={styles.scenery} aria-hidden="true"><span>{shapes[config.experience.motif]||'✧'}</span><span>{shapes[config.experience.motif]||'✧'}</span></div>
      <div className={styles.hero}>
        <div className={styles.eyebrow}>{config.gradeLabel} · Level {config.level}</div>
        <h1>{config.title}</h1><p>{config.experience.world}: {config.experience.sceneDescription}.</p>
        <div className={styles.missJulie}><img src="/miss-julie/welcome.webp" alt="Miss Julie, teaching companion" /><div className={styles.speech}>“Welcome! We are exploring {config.title.toLowerCase()}.”</div></div>
      </div>
      <div className={styles.board}>
        <div className={styles.boardHeading}>Explore the lesson</div>
        <div className={styles.symbol}>{shapes[config.experience.motif]||'✧'}</div>
        <h2>{active.label}</h2><p>{active.educatorNote}</p>
        <div className={styles.choices}>{options.map((option,i)=><button type="button" key={option.label} aria-pressed={selected===i} onClick={()=>setSelected(i)}>{i+1}. {option.label}</button>)}</div>
      </div>
    </div>
    <div className={styles.footer}>
      <span><b>{activities.length}</b> approved-playable activities in this workspace</span>
      <span>Modes: {interactions.allowedModes.join(' · ')}</span>
    </div>
    <p className={styles.note}>This preview demonstrates each level’s distinct visual design. Nothing is unlocked or graded. Publishing requires approved activities, security checks, and MongoDB curriculum status.</p>
  </div>
}
