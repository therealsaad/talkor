'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Award,
  Crown,
  Flame,
  LockKeyhole,
  Medal,
  Mic2,
  Sparkles,
  Star,
  Trophy,
} from 'lucide-react'
import { progressService, type AchievementItem } from '@/services/progress-service'
import { useAuth } from '@/components/auth/auth-provider'
import { cardMotion, badgeReveal, pageVariants } from '@/motion/presets'
import { learnerAvatar, accountAvatar, talkoraAssets } from '@/config/talkora-assets'
import { TalkoraLoader } from '@/components/student/talkora-loader'
import { KGRewardCollectionShelf } from '@/features/lessons/grades/kg/components/KGRewardCollectionShelf'
import { kgRewardsService } from '@/services/kg-rewards-service'

import { Volume2 } from 'lucide-react'

export default function RewardsAndBadgesPage() {
  const [items, setItems] = useState<AchievementItem[]>([])
  const { student } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [kgAccess, setKgAccess] = useState<'loading' | 'allowed' | 'denied' | 'error' | null>(null)
  const [kgAccessRetry, setKgAccessRetry] = useState(0)

  useEffect(() => {
    let alive = true
    if (student?.grade === 0) {
      setKgAccess('loading')
      void kgRewardsService.access().then(({ eligible }) => {
        if (alive) setKgAccess(eligible ? 'allowed' : 'denied')
      }).catch(() => {
        if (alive) setKgAccess('error')
      })
      return () => { alive = false }
    }
    setKgAccess(null)
    Promise.allSettled([progressService.getMyAchievements()]).then(
      ([achieveRes]) => {
        if (!alive) return
        if (achieveRes.status === 'fulfilled') {
          setItems(achieveRes.value)
        } else {
          setError("Your reward shelf couldn't load right now.")
        }
        setLoading(false)
      },
    )
    return () => {
      alive = false
    }
  }, [student?.grade, kgAccessRetry])

  const julieRewardsSpeech = "You earned this because you kept trying! Every badge is a celebration of your brave speaking."

  if (student?.grade === 0 && (!kgAccess || kgAccess === 'loading')) {
    return <TalkoraLoader compact message="Checking your KG rewards access..." />
  }

  if (student?.grade === 0 && kgAccess === 'allowed') return <KGRewardCollectionShelf />

  if (student?.grade === 0 && kgAccess === 'denied') {
    return <main className="kg-reward-shelf"><section className="kg-reward-shelf__message" role="status">
      <h1>KG rewards are not available yet</h1>
      <p>Your school needs to enable KG alphabet lessons for your account before you can collect these stars.</p>
      <Link href="/student/profile">Back to my profile</Link>
    </section></main>
  }

  if (student?.grade === 0 && kgAccess === 'error') {
    return <main className="kg-reward-shelf"><section className="kg-reward-shelf__error" role="alert">
      <h1>We could not check your KG rewards</h1>
      <p>Please try again in a moment.</p>
      <button type="button" onClick={() => setKgAccessRetry((value) => value + 1)}>Try again</button>
    </section></main>
  }

  if (loading) {
    return <TalkoraLoader compact message="Polishing your trophies and badges..." />
  }

  const firstName = student?.fullName?.split(' ')[0] || 'Explorer'
  const studentAvatarUrl = learnerAvatar(student?.avatarType) || accountAvatar(student?.avatar)

  const unlockedCount = items.filter((item) => item.unlocked).length

  // Syllabus Badges matching Storyboard
  const badges = [
    {
      id: 'badge-1',
      title: 'Favourite Finder',
      unit: 'Unit 1: My Favourite Things',
      icon: '🎡',
      unlocked: true,
      color: '#ffd34e',
    },
    {
      id: 'badge-2',
      title: 'Partner Presenter',
      unit: 'Unit 2: All About My Partner',
      icon: '🏆',
      unlocked: false,
      color: '#38bdf8',
    },
    {
      id: 'badge-3',
      title: 'Menu Master',
      unit: 'Unit 3: Let’s Order',
      icon: '🍲',
      unlocked: false,
      color: '#fbbf24',
    },
    {
      id: 'badge-4',
      title: 'Calendar Communicator',
      unit: 'Unit 4: On My Calendar',
      icon: '📅',
      unlocked: false,
      color: '#fb923c',
    },
  ]

  // Achievements matching Storyboard
  const achievements = [
    {
      id: 'first-convo',
      title: 'First Conversation Completed',
      icon: '🏆',
      unlocked: true,
      color: '#a855f7',
    },
    {
      id: 'streak-3',
      title: '3 Days Streak',
      icon: '⚡',
      unlocked: true,
      color: '#f97316',
    },
    {
      id: 'perfect-listener',
      title: 'Perfect Listener',
      icon: '🎧',
      unlocked: false,
      color: '#10b981',
    },
    {
      id: 'practice-star',
      title: 'Practice Star',
      icon: '⭐',
      unlocked: false,
      color: '#eab308',
    },
  ]

  return (
    <motion.div
      className="talkora-rewards-storyboard-page"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Top Title Bar */}
      <div className="talkora-rewards-title-row">
        <div>
          <span className="talkora-kicker">
            <Trophy size={16} /> REWARDS & ACHIEVEMENTS
          </span>
          <h1 className="talkora-rewards-main-title">My Rewards</h1>
        </div>
      </div>

      {/* Main 2-Column Storyboard Layout */}
      <div className="talkora-rewards-2col-grid">
        {/* Left Column: Badges & Achievements */}
        <div className="talkora-rewards-left-pane">
          {/* Badges Section */}
          <section className="talkora-storyboard-card-box">
            <div className="talkora-storyboard-card-header">
              <h3>Badges</h3>
              <span className="talkora-view-all-link">View All</span>
            </div>

            <div className="talkora-badges-horizontal-row">
              {badges.map((badge) => (
                <motion.div
                  key={badge.id}
                  className={`talkora-storyboard-badge-item ${badge.unlocked ? 'is-unlocked' : 'is-locked'}`}
                  variants={cardMotion}
                  initial="rest"
                  whileHover="hover"
                >
                  <div
                    className="talkora-badge-medal-circle"
                    style={{ borderColor: badge.unlocked ? badge.color : '#334155' }}
                  >
                    <span className="talkora-badge-icon-emoji">{badge.icon}</span>
                    {!badge.unlocked && (
                      <div className="talkora-badge-lock-overlay">
                        <LockKeyhole size={12} />
                      </div>
                    )}
                  </div>
                  <strong className="talkora-badge-item-title">{badge.title}</strong>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Achievements Section */}
          <section className="talkora-storyboard-card-box">
            <div className="talkora-storyboard-card-header">
              <h3>Achievements</h3>
              <span className="talkora-view-all-link">View All</span>
            </div>

            <div className="talkora-badges-horizontal-row">
              {achievements.map((achieve) => (
                <motion.div
                  key={achieve.id}
                  className={`talkora-storyboard-badge-item ${achieve.unlocked ? 'is-unlocked' : 'is-locked'}`}
                  variants={cardMotion}
                  initial="rest"
                  whileHover="hover"
                >
                  <div
                    className="talkora-badge-medal-circle talkora-medal-achievement"
                    style={{ borderColor: achieve.unlocked ? achieve.color : '#334155' }}
                  >
                    <span className="talkora-badge-icon-emoji">{achieve.icon}</span>
                    {!achieve.unlocked && (
                      <div className="talkora-badge-lock-overlay">
                        <LockKeyhole size={12} />
                      </div>
                    )}
                  </div>
                  <strong className="talkora-badge-item-title">{achieve.title}</strong>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Large Celebrating Student Avatar Card (Storyboard Screen 9) */}
        <aside className="talkora-rewards-right-pane">
          <div className="talkora-rewards-celebration-stage">
            {/* Ambient Floating Stars */}
            <div className="talkora-floating-stars-layer" aria-hidden="true">
              <motion.span
                className="talkora-floating-star star-1"
                animate={{ y: [0, -14, 0], scale: [1, 1.15, 1], rotate: [0, 15, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                ⭐
              </motion.span>
              <motion.span
                className="talkora-floating-star star-2"
                animate={{ y: [0, 12, 0], scale: [1, 1.2, 1], rotate: [0, -20, 0] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              >
                ⭐
              </motion.span>
              <motion.span
                className="talkora-floating-star star-3"
                animate={{ y: [0, -10, 0], scale: [0.9, 1.1, 0.9] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              >
                ✨
              </motion.span>
              <motion.span
                className="talkora-floating-star star-4"
                animate={{ y: [0, 8, 0], scale: [1, 1.25, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
              >
                ⭐
              </motion.span>
            </div>

            {/* Glowing Aura Frame */}
            <div className="talkora-rewards-avatar-figure-wrap">
              <Image
                src={studentAvatarUrl}
                alt={firstName}
                width={240}
                height={340}
                className="talkora-rewards-full-avatar-img"
                priority
              />
            </div>

            {/* Student Name & Celebration Banner */}
            <div className="talkora-rewards-student-badge">
              <Sparkles size={16} className="talkora-gold-sparkle" />
              <strong>{firstName}</strong>
              <small>English Adventure Hero</small>
            </div>
          </div>
        </aside>
      </div>
    </motion.div>
  )
}
