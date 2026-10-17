'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  Ear,
  Languages,
  MessageCircle,
  Mic2,
  Play,
  RefreshCcw,
  Sparkles,
  Volume2,
  Wand2,
  UsersRound,
} from 'lucide-react'
import { practiceService, type MistakeItem } from '@/services/practice-service'
import { aiService } from '@/services/ai-service'
import { curriculumService } from '@/services/curriculum-service'
import { useAuth } from '@/components/auth/auth-provider'
import { cardMotion, pageVariants } from '@/motion/presets'
import { talkoraAssets } from '@/config/talkora-assets'
import { TalkoraLoader } from '@/components/student/talkora-loader'

import { useMissJulieVoice } from '@/hooks/use-miss-julie-voice'

interface PracticeCard {
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
  color: string
  gradient: string
  href: string
  badge?: string
}

export default function PracticeHubPage() {
  const { student } = useAuth()
  const [mistakes, setMistakes] = useState<MistakeItem[]>([])
  const [recommendation, setRecommendation] = useState('')
  const [currentLessonId, setCurrentLessonId] = useState('1')
  const [loading, setLoading] = useState(true)
  const julieVoice = useMissJulieVoice()

  useEffect(() => {
    let alive = true
    async function init() {
      try {
        const [mistakeRes, recRes, classRes] = await Promise.allSettled([
          practiceService.getMistakes(),
          aiService.getRecommendation(),
          curriculumService.getClasses(),
        ])

        if (!alive) return

        if (mistakeRes.status === 'fulfilled') {
          setMistakes(mistakeRes.value)
        }
        if (recRes.status === 'fulfilled') {
          setRecommendation(recRes.value.message)
        }

        if (student) {
          const studentGrade = student.grade
          if (classRes.status === 'fulfilled') {
            const ownClass = classRes.value.find((c) => c.grade === studentGrade)
            if (ownClass) {
              const levels = await curriculumService.getLevels(ownClass.id)
              const activeLevel =
                levels.find((l) => l.status === 'in-progress') ||
                levels.find((l) => l.status === 'available') ||
                levels[0]
              if (activeLevel) {
                setCurrentLessonId(String(activeLevel.unitNumber || activeLevel.number || 1))
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to load practice hub', err)
      } finally {
        if (alive) setLoading(false)
      }
    }
    init()
    return () => {
      alive = false
    }
  }, [student])

  const juliePracticeSpeech = recommendation || 'A little practice will make this easier. Choose a skill and let us get stronger together!'

  if (loading) {
    return <TalkoraLoader compact message="Preparing your English practice room..." />
  }

  const practiceCards: PracticeCard[] = [
    {
      id: 'speaking',
      title: 'Speaking Studio',
      subtitle: 'Talk about your favourites, hobbies & daily life with Miss Julie',
      icon: <Mic2 size={26} />,
      color: '#3B82F6',
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
      href: '/student/practice/talk',
      badge: 'LIVE TALK',
    },
    {
      id: 'family',
      title: 'Family Conversation',
      subtitle: 'Record a favourites conversation and reflect on your progress',
      icon: <UsersRound size={26} />,
      color: '#0D9488',
      gradient: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
      href: '/student/practice/home',
      badge: 'LEVEL 1 HOME PRACTICE',
    },
    {
      id: 'listening',
      title: 'Listening',
      subtitle: 'Follow Sunny & Preethi and answer their stories',
      icon: <Ear size={26} />,
      color: '#10B981',
      gradient: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
      href: `/student/lesson/${currentLessonId}`,
    },
    {
      id: 'pronunciation',
      title: 'Pronunciation Hero',
      subtitle: 'Clear sounds, word stress & gentle retries',
      icon: <Volume2 size={26} />,
      color: '#8B5CF6',
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
      href: `/student/lesson/${currentLessonId}`,
      badge: 'RECOMMENDED',
    },
    {
      id: 'vocabulary',
      title: 'Word Explorer',
      subtitle: 'Discover active words with colourful picture cards',
      icon: <Languages size={26} />,
      color: '#F97316',
      gradient: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
      href: `/student/lesson/${currentLessonId}`,
    },
    {
      id: 'story-time',
      title: 'Story Time',
      subtitle: 'Listen, repeat & learn from folk tales',
      icon: <BookOpen size={26} />,
      color: '#EAB308',
      gradient: 'linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)',
      href: `/student/lesson/${currentLessonId}`,
    },
    {
      id: 'role-play',
      title: 'Role Play',
      subtitle: 'Real-life café, school & shop dialogues',
      icon: <Wand2 size={26} />,
      color: '#EC4899',
      gradient: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
      href: `/student/lesson/${currentLessonId}`,
    },
  ]

  return (
    <motion.div
      className="talkora-practice-hub"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Header Banner */}
      <div className="talkora-practice-header">
        <div className="talkora-practice-header__text">
          <span className="talkora-kicker">
            <Mic2 size={16} /> PRACTICE HUB
          </span>
          <h1>Grow Your English Superpowers</h1>
          <p>
            Choose a skill to sharpen. Practice makes speaking natural, confident, and fun!
          </p>
        </div>

        {/* Miss Julie Guidance Card */}
        <div className="talkora-practice-julie-card">
          <div className="talkora-practice-julie-avatar">
            <Image
              src={talkoraAssets.julie.encouraging}
              alt="Miss Julie encouraging you"
              width={72}
              height={96}
            />
          </div>
          <div className="talkora-practice-julie-message">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <strong>Miss Julie&apos;s Advice</strong>
              <button
                type="button"
                onClick={() => void julieVoice.replay()}
                style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '999px',
                  color: '#b45309',
                  cursor: 'pointer',
                  padding: '3px 8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
                title="Hear Miss Julie"
              >
                <Volume2 size={13} /> Listen
              </button>
            </div>
            <p>
              {juliePracticeSpeech}
            </p>
          </div>
        </div>
      </div>

      {/* Main Practice Category Grid (Reference Image 1 Screen 9) */}
      <section className="talkora-practice-grid-section">
        <h2 className="talkora-section-label">Practice Arenas</h2>

        <div className="talkora-practice-cards-grid">
          {practiceCards.map((card) => (
            <motion.div
              key={card.id}
              variants={cardMotion}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
            >
              <Link
                href={card.href}
                className="talkora-practice-tile"
                style={{ '--tile-gradient': card.gradient } as React.CSSProperties}
              >
                <div className="talkora-practice-tile__icon-wrap">
                  {card.icon}
                </div>

                <div className="talkora-practice-tile__meta">
                  <div className="talkora-practice-tile__top">
                    <h3>{card.title}</h3>
                    {card.badge && (
                      <span className="talkora-practice-tile__badge">{card.badge}</span>
                    )}
                  </div>
                  <p>{card.subtitle}</p>
                </div>

                <div className="talkora-practice-tile__arrow">
                  <Play size={16} fill="currentColor" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Practice My Mistakes Section */}
      <section className="talkora-practice-mistakes-section">
        <div className="talkora-mistakes-card">
          <div className="talkora-mistakes-header">
            <div className="talkora-mistakes-header__icon">
              <RefreshCcw size={22} />
            </div>
            <div>
              <h3>Practice My Mistakes</h3>
              <p>Words and sentence patterns that could use another brave try</p>
            </div>
          </div>

          {mistakes.length > 0 ? (
            <div className="talkora-mistakes-list">
              {mistakes.slice(0, 6).map((item) => (
                <div key={item.id || item._id} className="talkora-mistake-row">
                  <span className="talkora-mistake-skill">{item.skill}</span>
                  <div className="talkora-mistake-detail">
                    <strong>Target: &ldquo;{item.expected}&rdquo;</strong>
                    <small>You said: &ldquo;{item.actual}&rdquo;</small>
                  </div>
                  <Link
                    href={`/student/lesson/${currentLessonId}`}
                    className="talkora-mistake-action-btn"
                  >
                    <span>Retry</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="talkora-mistakes-empty">
              <Sparkles size={24} className="talkora-sparkle-gold" />
              <p>
                You have no unresolved mistakes right now! Keep speaking proudly.
              </p>
            </div>
          )}
        </div>
      </section>
    </motion.div>
  )
}
