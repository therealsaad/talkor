'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Gift,
  Map,
  MessageCircle,
  Mic2,
  Sparkles,
  Star,
  Trophy,
  Zap,
} from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { curriculumService, type StudentCurriculum } from '@/services/curriculum-service'
import { memoryService, type StudentMemoryItem } from '@/services/memory-service'
import { cardMotion, pageVariants } from '@/motion/presets'
import { talkoraAssets } from '@/config/talkora-assets'
import { TalkoraLoader } from '@/components/student/talkora-loader'

import { useMissJulieVoice } from '@/hooks/use-miss-julie-voice'
import { Volume2 } from 'lucide-react'

export default function StudentHomePage() {
  const { session } = useAuth()
  const [curriculum, setCurriculum] = useState<StudentCurriculum | null>(null)
  const [curriculumError, setCurriculumError] = useState('')
  const [memories, setMemories] = useState<StudentMemoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const julieVoice = useMissJulieVoice()
  const greetedRef = useRef(false)

  useEffect(() => {
    let alive = true
    async function loadData() {
      try {
        const [currData, memoryData] = await Promise.allSettled([
          curriculumService.getMyCurriculum(),
          memoryService.getMyMemories ? memoryService.getMyMemories() : Promise.resolve([]),
        ])

        if (alive) {
          if (currData.status === 'fulfilled' && currData.value.units.length > 0) {
            setCurriculum(currData.value)
          } else if (currData.status === 'fulfilled') {
            setCurriculumError('No published lessons are available for your class yet. Please ask your school administrator to publish the curriculum.')
          } else {
            setCurriculumError(currData.reason instanceof Error
              ? currData.reason.message
              : 'Your class curriculum is unavailable. Please ask your school administrator for help.')
          }
          if (memoryData.status === 'fulfilled' && Array.isArray(memoryData.value)) {
            setMemories(memoryData.value)
          }
          setLoading(false)
        }
      } catch (err) {
        console.error('Failed to load home dashboard', err)
        if (alive) setLoading(false)
      }
    }
    loadData()
    return () => {
      alive = false
    }
  }, [])

  const student = session?.student
  const firstName = student?.fullName?.split(' ')[0] || 'Explorer'
  const currentUnit = curriculum?.units.find((u) => u.status === 'CURRENT') || curriculum?.units[0]

  const currentUnitNumber = Number(currentUnit?.unitNumber) || 0
  const unitProgress = Math.min(100, Math.max(0, currentUnit?.progress ?? 0))
  const stageNumber = Math.max(1, Math.min(10, Math.round((unitProgress / 100) * 10)))
  const currentLesson =
    currentUnit?.lessons?.find((item) => !item.completed) ||
    currentUnit?.lessons?.[0]
  const currentLessonNumber = currentLesson?.order || stageNumber
  const continueHref = '/student/continue'

  // Personalized memory greeting
  const favSport = memories.find((m) => m.key === 'favourite_sport' || m.fact?.toLowerCase().includes('sport'))
  const favFood = memories.find((m) => m.key === 'favourite_food' || m.fact?.toLowerCase().includes('food'))

  let julieGreeting = currentUnit
    ? `Welcome back, ${firstName}! Ready for another speaking adventure in ${currentUnit.worldName || currentUnit.title}?`
    : curriculumError || `Hi ${firstName}! Your next lesson will appear here after your school publishes the curriculum.`
  if (currentUnit && favSport?.value) {
    julieGreeting = `Hi ${firstName}! Ready to talk about ${favSport.value} and explore ${currentUnit.worldName}?`
  } else if (currentUnit && favFood?.value) {
    julieGreeting = `Hello ${firstName}! Let’s jump back into our English adventure together!`
  }

  // Keep the greeting available while Miss Julie is speaking without relying
  // on an optional text-sync hook.
  const displayedJulieGreeting = julieGreeting

  useEffect(() => {
    if (loading || !student || curriculumError || greetedRef.current) return
    greetedRef.current = true
    const timer = window.setTimeout(() => {
      void julieVoice.speak(
        julieGreeting,
        `home:${student.id || firstName}:${currentUnitNumber}`,
        'PAGE_GUIDANCE',
      )
    }, 450)
    return () => window.clearTimeout(timer)
  }, [loading, student, curriculumError, julieGreeting, currentUnitNumber, firstName, julieVoice.speak])

  if (loading) {
    return <TalkoraLoader compact message="Preparing your English Adventure..." />
  }

  return (
    <motion.div
      className="talkora-home-dashboard"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Top Welcome / Greeting Banner */}
      <div className="talkora-home-welcome-row">
        <div>
          <span className="talkora-kicker">
            <Sparkles size={16} /> TALKORA ADVENTURE HUB
          </span>
          <h1 className="talkora-home-title">
            Hi <em>{firstName}</em>! ✨
          </h1>
          <p className="talkora-home-subtitle">
            Every sentence you speak makes your English superpowers stronger.
          </p>
        </div>
      </div>

      {/* Main Grid: Hero Card (Left/Center) + Today's Goal (Right) */}
      <div className="talkora-home-main-grid">
        {/* Continue Learning Hero Card */}
        <motion.div
          className="talkora-home-hero-card"
          variants={cardMotion}
          initial="rest"
          whileHover="hover"
          whileTap="tap"
        >
          <div className="talkora-home-hero-content">
            <div className="talkora-home-hero-badge">
              <Zap size={15} />
              <span>CONTINUE LEARNING</span>
            </div>

            <h2 className="talkora-home-hero-unit-title">
              {currentUnit ? `Unit ${currentUnitNumber}: ${currentUnit.title}` : 'Your next lesson'}
            </h2>
            {currentUnit ? <p className="talkora-home-hero-stage-desc">
              Stage {currentLessonNumber} of {Math.max(1, currentUnit.lessonCount || currentUnit.lessons?.length || 1)} — <strong>{currentLesson?.title || 'Continue learning'}</strong>
            </p> : <p role="status" className="talkora-home-hero-stage-desc">{curriculumError || 'Your next lesson will appear here after your school publishes the curriculum.'}</p>}

            {/* Progress bar */}
            {currentUnit ? <div className="talkora-home-hero-progress-wrap">
              <div className="talkora-home-hero-progress-labels">
                <span>Adventure Progress</span>
                <strong>{unitProgress}%</strong>
              </div>
              <div className="talkora-home-hero-progress-track">
                <motion.div
                  className="talkora-home-hero-progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${unitProgress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div> : null}

            {/* Continue Button */}
            <Link
              href={continueHref}
              className="talkora-primary-cta-btn"
            >
              <span>{currentUnit ? 'Continue Adventure' : 'Check for lessons'}</span>
              <ArrowRight size={20} />
            </Link>
          </div>

          {/* Miss Julie Character in Hero */}
          <div className="talkora-home-hero-julie">
            <div className="talkora-home-julie-bubble">
              <div className="talkora-bubble-header">
                <span className="talkora-bubble-tag"><Sparkles size={12} /> MISS JULIE</span>
                <button
                  type="button"
                  onClick={() => void julieVoice.replay()}
                  className="talkora-replay-btn"
                  title="Listen to Miss Julie again"
                  aria-label="Listen to Miss Julie again"
                >
                  <Volume2 size={16} />
                </button>
              </div>
              <p>{julieVoice.isSpeaking ? displayedJulieGreeting : julieGreeting}{julieVoice.isSpeaking ? <b className="talkora-type-caret">|</b> : null}</p>
              {julieVoice.isSpeaking && (
                <div className="tk-mini-wave">
                  <i /><i /><i /><i />
                </div>
              )}
            </div>
            <div className="talkora-home-julie-figure">
              <Image
                src={julieVoice.isSpeaking ? (talkoraAssets.julie.speaking || talkoraAssets.julie.welcome) : talkoraAssets.julie.welcome}
                alt="Miss Julie welcoming you"
                width={260}
                height={340}
                className="talkora-home-julie-img"
                priority
              />
            </div>
          </div>
        </motion.div>

        {/* Today's Goal Card */}
        <motion.div
          className="talkora-home-goal-card"
          variants={cardMotion}
          initial="rest"
          whileHover="hover"
        >
          <div className="talkora-goal-header">
            <span className="talkora-goal-icon-wrap">
              <Gift size={22} />
            </span>
            <div>
              <small>TODAY&apos;S GOAL</small>
              <h3>Complete 2 Conversations</h3>
            </div>
          </div>

          <div className="talkora-goal-body">
            <p>Speak clearly with Miss Julie to earn today&apos;s special reward!</p>

            <div className="talkora-goal-progress">
              <div className="talkora-goal-progress-bar">
                <span style={{ width: '50%' }} />
              </div>
              <span className="talkora-goal-count">1 / 2</span>
            </div>
          </div>

          <div className="talkora-goal-reward-pill">
            <Star size={16} fill="currentColor" />
            <span>+50 Bonus XP on completion</span>
          </div>
        </motion.div>
      </div>

      {/* Quick Action Cards Grid (Daily Quest, Quick Practice, Talk to Julie) */}
      <div className="talkora-home-actions-section">
        <h3 className="talkora-section-label">Quick Actions</h3>

        <div className="talkora-home-actions-grid">
          {/* Action 1: Adventure Map */}
          <motion.div variants={cardMotion} whileHover="hover" whileTap="tap">
            <Link href="/student/levels" className="talkora-action-card talkora-action-card--map">
              <div className="talkora-action-card__icon">
                <Map size={28} />
              </div>
              <div className="talkora-action-card__text">
                <strong>Adventure Map</strong>
                <small>Explore 8 English worlds</small>
              </div>
              <ArrowRight size={18} className="talkora-action-card__arrow" />
            </Link>
          </motion.div>

          {/* Action 2: Quick Practice */}
          <motion.div variants={cardMotion} whileHover="hover" whileTap="tap">
            <Link
              href="/student/practice"
              className="talkora-action-card talkora-action-card--practice"
            >
              <div className="talkora-action-card__icon">
                <Mic2 size={28} />
              </div>
              <div className="talkora-action-card__text">
                <strong>Quick Practice</strong>
                <small>Speaking & pronunciation drills</small>
              </div>
              <ArrowRight size={18} className="talkora-action-card__arrow" />
            </Link>
          </motion.div>

          {/* Action 3: Talk to Julie */}
          <motion.div variants={cardMotion} whileHover="hover" whileTap="tap">
            <Link
              href="/student/practice/talk"
              className="talkora-action-card talkora-action-card--julie"
            >
              <div className="talkora-action-card__icon">
                <MessageCircle size={28} />
              </div>
              <div className="talkora-action-card__text">
                <strong>Talk to Julie</strong>
                <small>Real-time conversational partner</small>
              </div>
              <ArrowRight size={18} className="talkora-action-card__arrow" />
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
