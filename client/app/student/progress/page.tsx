'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Award, BookOpen, CheckCircle2, Clock3, Flame, Sparkles, Target, Volume2 } from 'lucide-react'
import { progressService, type StudentOverallProgress } from '@/services/progress-service'
import { aiService } from '@/services/ai-service'
import { cardMotion, pageVariants } from '@/motion/presets'
import { talkoraAssets } from '@/config/talkora-assets'
import { TalkoraLoader } from '@/components/student/talkora-loader'
import { useMissJulieVoice } from '@/hooks/use-miss-julie-voice'

export default function ProgressOverviewPage() {
  const [progress, setProgress] = useState<StudentOverallProgress | null>(null)
  const [recommendation, setRecommendation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const julieVoice = useMissJulieVoice()

  useEffect(() => {
    let alive = true
    Promise.allSettled([progressService.getMyProgress(), aiService.getRecommendation()]).then(([progressResult, recResult]) => {
      if (!alive) return
      if (progressResult.status === 'fulfilled') setProgress(progressResult.value)
      else setError('Your saved progress could not be loaded right now.')
      if (recResult.status === 'fulfilled') setRecommendation(recResult.value.message)
      setLoading(false)
    })
    return () => { alive = false }
  }, [])

  const summary = useMemo(() => {
    const levels = progress?.levels ?? []
    const lessons = levels.flatMap((level) => level.lessons ?? [])
    const scoredLessons = lessons.filter((lesson) => Number.isFinite(lesson.accuracy) && lesson.accuracy > 0)
    const completedLevels = levels.filter((level) => level.status === 'completed').length
    const completedLessons = lessons.filter((lesson) => lesson.completed).length
    const completedActivities = lessons.reduce((sum, lesson) => sum + (lesson.completedActivityIds?.length ?? 0), 0)
    const learningMinutes = Math.round(levels.reduce((sum, level) => sum + (level.totalTimeMs || 0), 0) / 60000)
    const avgAccuracy = scoredLessons.length
      ? Math.round(scoredLessons.reduce((sum, lesson) => sum + lesson.accuracy, 0) / scoredLessons.length)
      : null
    const overallPercent = levels.length ? Math.round((completedLevels / levels.length) * 100) : 0
    return { levels, lessons, completedLevels, completedLessons, completedActivities, learningMinutes, avgAccuracy, overallPercent }
  }, [progress])

  const julieProgressSpeech = recommendation || (
    summary.completedActivities > 0
      ? `You have completed ${summary.completedActivities} speaking activities. Keep going!`
      : 'Your journey is ready. Complete your first speaking activity and your real progress will appear here.'
  )

  useEffect(() => {
    if (loading) return
    const timer = window.setTimeout(() => void julieVoice.speak(julieProgressSpeech, 'progress-guidance', 'PAGE_GUIDANCE'), 350)
    return () => window.clearTimeout(timer)
  }, [loading, julieProgressSpeech, julieVoice.speak])

  if (loading) return <TalkoraLoader message="Loading your saved learning progress..." />

  return (
    <motion.div className="talkora-progress-hub" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <div className="talkora-progress-header">
        <div className="talkora-progress-header__text">
          <span className="talkora-kicker"><Award size={16} /> REAL LEARNING PROGRESS</span>
          <h1>Your English Adventure</h1>
          <p>Everything here comes from your saved Talkora attempts and completed activities.</p>
        </div>
        <div className="talkora-progress-julie-card">
          <Image src={talkoraAssets.julie.celebrate} alt="Miss Julie" width={72} height={96} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <strong>Miss Julie</strong>
              <button type="button" onClick={() => void julieVoice.replay()} className="talkora-test-voice-btn" style={{ minHeight: 34, padding: '0 10px' }}>
                <Volume2 size={13} /> Listen
              </button>
            </div>
            <p>{julieProgressSpeech}</p>
          </div>
        </div>
      </div>

      {error ? <div role="alert" style={{ background: '#fff1f0', color: '#9f332d', padding: 14, borderRadius: 12, marginBottom: 18 }}>{error}</div> : null}

      <motion.section className="talkora-overall-progress-card" variants={cardMotion} initial="rest" whileHover="hover">
        <div className="talkora-overall-progress-header">
          <div><h2>Published Worlds Completed</h2><small>Calculated from your MongoDB progress document</small></div>
          <span className="talkora-overall-percent">{summary.overallPercent}%</span>
        </div>
        <div className="talkora-overall-bar-wrap"><motion.div className="talkora-overall-bar-fill" initial={{ width: 0 }} animate={{ width: `${summary.overallPercent}%` }} transition={{ duration: 0.8 }} /></div>
      </motion.section>

      <div className="talkora-progress-stats-grid">
        <Metric icon={<Target size={22} />} label="Worlds Completed" value={`${summary.completedLevels}/${summary.levels.length || 0}`} className="talkora-metric--units" />
        <Metric icon={<CheckCircle2 size={22} />} label="Lessons Completed" value={`${summary.completedLessons}/${summary.lessons.length || 0}`} className="talkora-metric--stages" />
        <Metric icon={<BookOpen size={22} />} label="Activities Completed" value={String(summary.completedActivities)} className="talkora-metric--conversations" />
        <Metric icon={<Sparkles size={22} />} label="XP Earned" value={String(progress?.xp ?? 0)} className="talkora-metric--xp" />
      </div>

      <section className="talkora-skills-section">
        <h2 className="talkora-section-label">Recorded Performance</h2>
        <div className="talkora-skills-card">
          <RealRow label="Speaking accuracy" value={summary.avgAccuracy === null ? 'No scored attempts yet' : `${summary.avgAccuracy}%`} />
          <RealRow label="Learning time" value={`${summary.learningMinutes} min`} icon={<Clock3 size={17} />} />
          <RealRow label="Current streak" value={`${progress?.streak ?? 0} day${(progress?.streak ?? 0) === 1 ? '' : 's'}`} icon={<Flame size={17} />} />
          <RealRow label="Stars earned" value={String(progress?.stars ?? 0)} icon={<Award size={17} />} />
        </div>
      </section>

      <div className="talkora-progress-cta-row"><Link href="/student/levels" className="talkora-primary-cta-btn"><span>Continue Adventure</span><ArrowRight size={20} /></Link></div>
    </motion.div>
  )
}

function Metric({ icon, label, value, className }: { icon: ReactNode; label: string; value: string; className: string }) {
  return <motion.div className={`talkora-metric-card ${className}`} variants={cardMotion}><div className="talkora-metric-card__icon">{icon}</div><div className="talkora-metric-card__text"><small>{label}</small><strong>{value}</strong></div></motion.div>
}

function RealRow({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return <div className="talkora-skill-row"><div className="talkora-skill-labels"><strong style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>{icon}{label}</strong><span>{value}</span></div></div>
}
