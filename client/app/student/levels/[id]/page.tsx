'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  Flame,
  Lock,
  MessageCircle,
  Mic,
  Sparkles,
  Star,
  Trophy,
  Volume2,
} from 'lucide-react'
import { curriculumService, type StudentCurriculum, type StudentCurriculumLesson } from '@/services/curriculum-service'
import { talkoraAssets } from '@/config/talkora-assets'
import { TalkoraLoader } from '@/components/student/talkora-loader'
import { pageVariants } from '@/motion/presets'
import { useMissJulieVoice } from '@/hooks/use-miss-julie-voice'

interface StageItem extends StudentCurriculumLesson {
  status: 'COMPLETED' | 'CURRENT' | 'LOCKED'
  type: string
  description: string
  badge: string
  icon: React.ReactNode
}

function iconForStage(order: number) {
  const icons = [<Volume2 key="listen" size={20} />, <Mic key="mic" size={20} />, <BookOpen key="book" size={20} />, <MessageCircle key="talk" size={20} />, <Trophy key="trophy" size={20} />]
  return icons[(Math.max(1, order) - 1) % icons.length]
}

function stageType(order: number, title = '', subtitle = '') {
  const copy = `${title} ${subtitle}`.toLowerCase()
  if (copy.includes('warm')) return 'Warm-up'
  if (copy.includes('listen') || copy.includes('model')) return 'Listen'
  if (copy.includes('repeat')) return 'Repeat'
  if (copy.includes('follow') || copy.includes('reason')) return 'Go Deeper'
  if (copy.includes('interact') || copy.includes('conversation') || copy.includes('talk')) return 'Converse'
  if (copy.includes('present')) return 'Present'
  if (copy.includes('challenge') || copy.includes('final')) return 'Challenge'
  const types = ['Listen', 'Speak', 'Interact', 'Practice', 'Challenge']
  return types[(Math.max(1, order) - 1) % types.length]
}

export default function UnitDetailPage() {
  const params = useParams()
  const routeId = typeof params?.id === 'string' ? params.id : ''
  const [curriculum, setCurriculum] = useState<StudentCurriculum | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedLessonId, setSelectedLessonId] = useState('')
  const greetedRef = useRef(false)
  const julie = useMissJulieVoice()

  useEffect(() => {
    let alive = true
    curriculumService.getMyCurriculum()
      .then((data) => {
        if (!alive) return
        setCurriculum(data)
        setLoading(false)
      })
      .catch((cause) => {
        if (!alive) return
        console.error('Failed to load unit details', cause)
        setError(cause instanceof Error ? cause.message : 'This adventure could not be loaded.')
        setLoading(false)
      })
    return () => { alive = false }
  }, [])

  const unit = useMemo(() => {
    if (!curriculum) return null
    const number = Number(routeId)
    return curriculum.units.find((item) => item.id === routeId || (Number.isFinite(number) && Number(item.unitNumber) === number)) || null
  }, [curriculum, routeId])

  const stages = useMemo<StageItem[]>(() => {
    if (!unit) return []
    const firstIncomplete = unit.lessons.findIndex((lesson) => !lesson.completed)
    return unit.lessons.map((lesson, index) => {
      const lockedUnit = unit.status === 'LOCKED' || unit.status === 'UPCOMING'
      const status: StageItem['status'] = lesson.completed
        ? 'COMPLETED'
        : !lockedUnit && (firstIncomplete === -1 || index === firstIncomplete)
          ? 'CURRENT'
          : 'LOCKED'
      const order = Number(lesson.order) || index + 1
      return {
        ...lesson,
        order,
        status,
        type: stageType(order, lesson.title, lesson.subtitle || ''),
        description: lesson.subtitle || `Continue ${lesson.title} with Miss Julie and practise your English step by step.`,
        badge: status === 'COMPLETED' ? 'Completed' : `Stage ${order}`,
        icon: iconForStage(order),
      }
    })
  }, [unit])

  useEffect(() => {
    if (!stages.length) return
    if (selectedLessonId && stages.some((item) => item.id === selectedLessonId)) return
    const next = stages.find((item) => item.status === 'CURRENT') || stages[0]
    setSelectedLessonId(next?.id || '')
  }, [stages, selectedLessonId])

  const selectedStage = stages.find((item) => item.id === selectedLessonId) || stages[0]
  const unitNumber = unit?.unitNumber || 1
  const progress = Math.min(100, Math.max(0, Number(unit?.progress) || 0))
  const julieLine = unit
    ? unit.status === 'COMPLETED'
      ? `Amazing! You completed ${unit.worldName || unit.title}. You can replay any stage whenever you want.`
      : `Welcome to ${unit.worldName || unit.title}! I saved your progress. Let's continue from your next stage.`
    : ''

  useEffect(() => {
    if (!unit || !julieLine || greetedRef.current) return
    greetedRef.current = true
    const timer = window.setTimeout(() => {
      void julie.speak(julieLine, `level:${unit.id}:${unit.status}`, 'PAGE_GUIDANCE')
    }, 350)
    return () => window.clearTimeout(timer)
  }, [unit, julieLine, julie.speak])

  if (loading) return <TalkoraLoader compact message="Loading your adventure..." />

  if (error || !unit) {
    return (
      <main className="talkora-error">
        <div className="talkora-error__icon">!</div>
        <span className="talkora-error__eyebrow">ADVENTURE NOT FOUND</span>
        <h1>This learning world is not available.</h1>
        <p>{error || 'This level is not part of your current class curriculum.'}</p>
        <Link href="/student/levels">BACK TO ADVENTURE MAP</Link>
      </main>
    )
  }

  if (!stages.length || !selectedStage) {
    return (
      <main className="talkora-error">
        <h1>This adventure has no published lessons yet.</h1>
        <Link href="/student/levels">BACK TO ADVENTURE MAP</Link>
      </main>
    )
  }

  const canStart = selectedStage.status !== 'LOCKED'

  return (
    <motion.div className="talkora-unit-detail-page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <div className="talkora-unit-back-row">
        <Link href="/student/levels" className="talkora-unit-back-btn">
          <ArrowLeft size={18} />
          <span>Adventure Map</span>
        </Link>
        <div className="talkora-unit-badge">
          <Sparkles size={14} />
          <span>UNIT {unitNumber} OF {curriculum?.totalUnits || curriculum?.units.length || 1}</span>
        </div>
      </div>

      <div className="talkora-unit-main-layout">
        <div className="talkora-unit-hero-card">
          <div className="talkora-unit-hero-info">
            <span className="talkora-kicker">{unit.worldName || unit.title}</span>
            <h1 className="talkora-unit-title">Unit {unitNumber}: {unit.title}</h1>
            <p className="talkora-unit-desc">
              {unit.learningObjectives?.[0] || unit.speakingGoals?.[0] || 'Practise listening, speaking, vocabulary and real conversation with Miss Julie.'}
            </p>

            <div className="talkora-unit-progress-block">
              <div className="talkora-unit-progress-labels">
                <span>Unit Progress</span>
                <strong>{progress}% Completed</strong>
              </div>
              <div className="talkora-unit-progress-track">
                <div className="talkora-unit-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          <div className="talkora-unit-julie-wrap">
            <div className="talkora-unit-julie-bubble">
              <p>{julieLine}</p>
            </div>
            <div className="talkora-unit-julie-figure">
              <Image src={talkoraAssets.julie.pointing} alt="Miss Julie guiding you" width={200} height={260} className="talkora-unit-julie-img" priority />
            </div>
          </div>
        </div>

        <div className="talkora-stage-preview-card">
          <div className="talkora-stage-preview-header">
            <div className="talkora-stage-type-tag">
              <span className="talkora-stage-tag-icon">{selectedStage.icon}</span>
              <span>STAGE {selectedStage.order} — {selectedStage.type.toUpperCase()}</span>
            </div>
            <div className="talkora-stage-status-badge">
              {selectedStage.status === 'COMPLETED' ? (
                <span className="badge-completed"><Check size={14} /> Completed</span>
              ) : selectedStage.status === 'CURRENT' ? (
                <span className="badge-current"><Flame size={14} /> Continue here</span>
              ) : (
                <span className="badge-locked"><Lock size={14} /> Locked</span>
              )}
            </div>
          </div>

          <h2 className="talkora-stage-preview-title">{selectedStage.title}</h2>
          <p className="talkora-stage-preview-desc">{selectedStage.description}</p>

          <div className="talkora-stage-reward-box">
            <div className="talkora-reward-item"><Star size={18} className="talkora-star-gold" fill="currentColor" /><span>+{selectedStage.xpReward || 0} XP</span></div>
            <div className="talkora-reward-item"><Award size={18} className="talkora-award-purple" /><span>{selectedStage.badge}</span></div>
          </div>

          {canStart ? (
            <Link href={`/student/lesson/${selectedStage.id}`} className="talkora-primary-cta-btn talkora-stage-start-btn">
              <span>{selectedStage.status === 'COMPLETED' ? 'REPLAY STAGE' : 'CONTINUE STAGE'}</span>
              <ArrowRight size={20} />
            </Link>
          ) : (
            <button type="button" className="talkora-primary-cta-btn talkora-stage-start-btn" disabled>
              <Lock size={18} /><span>FINISH THE CURRENT STAGE FIRST</span>
            </button>
          )}
        </div>
      </div>

      <div className="talkora-unit-stages-row">
        <h3 className="talkora-section-label">Unit Stages</h3>
        <div className="talkora-unit-stages-grid">
          {stages.map((stage) => {
            const isSelected = stage.id === selectedStage.id
            return (
              <motion.button
                key={stage.id}
                type="button"
                className={`talkora-stage-card status-${stage.status.toLowerCase()} ${isSelected ? 'is-selected' : ''}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedLessonId(stage.id)}
              >
                <div className="talkora-stage-card-num">
                  {stage.status === 'COMPLETED' ? <Check size={16} /> : stage.status === 'LOCKED' ? <Lock size={14} /> : stage.order}
                </div>
                <div className="talkora-stage-card-info">
                  <strong>{stage.type}</strong>
                  <small>{stage.title}</small>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
