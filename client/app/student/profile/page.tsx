'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Bell,
  Check,
  DoorOpen,
  HelpCircle,
  Mic2,
  Lock,
  School,
  ShieldCheck,
  Sparkles,
  User,
  Volume2,
} from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { progressService } from '@/services/progress-service'
import { voiceService, type VoicePlaybackState } from '@/services/voice-service'
import { accountAvatar, learnerAvatar, talkoraAssets } from '@/config/talkora-assets'
import { cardMotion, pageVariants } from '@/motion/presets'
import { TalkoraLoader } from '@/components/student/talkora-loader'
import { gradeLabel } from '@/lib/grade-label'

import { useMissJulieVoice } from '@/hooks/use-miss-julie-voice'

export default function ProfileAndSettingsPage() {
  const router = useRouter()
  const { session, logout } = useAuth()
  const [progress, setProgress] = useState<{ xp?: number; levels?: Array<{ status: string }> }>({})
  const [loading, setLoading] = useState(true)
  const [audioTesting, setAudioTesting] = useState<VoicePlaybackState>('idle')
  const [testSuccess, setTestSuccess] = useState(false)
  const julieVoice = useMissJulieVoice()

  useEffect(() => {
    let alive = true
    Promise.allSettled([progressService.getMyProgress()]).then(
      ([progressResult]) => {
        if (!alive) return
        if (progressResult.status === 'fulfilled') {
          setProgress(progressResult.value as unknown as typeof progress)
        }
        setLoading(false)
      },
    )
    return () => {
      alive = false
    }
  }, [])

  async function handleLogout() {
    await logout()
    router.replace('/login/student')
  }

  async function testMissJulieVoice() {
    setTestSuccess(false)
    const result = await julieVoice.speak(
      'Hello! Your microphone and Priya voice are working beautifully!',
      'test-voice',
      'PAGE_GUIDANCE',
    )
    if (result === 'spoken') {
      setTestSuccess(true)
    }
  }

  if (loading) {
    return <TalkoraLoader compact message="Opening your student profile..." />
  }

  const student = session?.student
  const studentName = student?.fullName || 'Talkora Explorer'
  const studentClass = student?.className || (student?.grade !== undefined ? gradeLabel(student.grade) : 'Class 4')
  const avatarUrl = accountAvatar(student?.avatar) || learnerAvatar(student?.avatarType)

  return (
    <motion.div
      className="talkora-profile-settings"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Header */}
      <div className="talkora-profile-header">
        <span className="talkora-kicker">
          <User size={16} /> STUDENT PROFILE & SETTINGS
        </span>
        <h1>My Talkora Account</h1>
        <p>Your classroom profile, audio settings and adventure controls.</p>
      </div>

      <div className="talkora-profile-layout-grid">
        {/* Left Card: Student Avatar & Info (Reference Image 1 Screen 18) */}
        <motion.div
          className="talkora-profile-card"
          variants={cardMotion}
          initial="rest"
          whileHover="hover"
        >
          <div className="talkora-profile-avatar-outer">
            <div className="talkora-profile-avatar-frame">
              <Image
                src={avatarUrl}
                alt={studentName}
                width={120}
                height={120}
                className="talkora-profile-avatar-img"
              />
            </div>
            <span className="talkora-profile-status-dot" title="Active Explorer" />
          </div>

          <h2 className="talkora-profile-name">{studentName}</h2>
          <span className="talkora-profile-badge">{studentClass}</span>

          {session?.school?.name && (
            <div className="talkora-profile-school-pill">
              <School size={16} />
              <span>{session.school.name}</span>
            </div>
          )}

          <div className="talkora-profile-mini-stats">
            <div className="talkora-mini-stat">
              <Sparkles size={16} className="talkora-gold-icon" />
              <strong>{progress.xp ?? 0}</strong>
              <small>Total XP</small>
            </div>
            <div className="talkora-mini-stat">
              <School size={16} className="talkora-blue-icon" />
              <strong>
                {progress.levels?.filter((l) => l.status === 'completed').length ?? 0}
              </strong>
              <small>Worlds Done</small>
            </div>
          </div>
        </motion.div>

        {/* Right Menu: Settings & Audio Controls (Reference Image 1 Screen 18) */}
        <div className="talkora-settings-list">
          {/* Item 1: Voice & Speech Testing */}
          <div className="talkora-settings-card">
            <div className="talkora-settings-card__header">
              <div className="talkora-settings-card__icon voice">
                <Volume2 size={20} />
              </div>
              <div className="talkora-settings-card__text">
                <h3>Voice & Speech Settings</h3>
                <p>Test Miss Julie&apos;s spoken voice and your microphone.</p>
              </div>
            </div>

            <div className="talkora-voice-test-box">
              <button
                type="button"
                className="talkora-test-voice-btn"
                onClick={testMissJulieVoice}
                disabled={audioTesting === 'loading' || audioTesting === 'speaking'}
              >
                <Volume2 size={18} />
                <span>
                  {audioTesting === 'loading'
                    ? 'Loading voice...'
                    : audioTesting === 'speaking'
                    ? 'Miss Julie is speaking...'
                    : 'Test Miss Julie’s Voice'}
                </span>
              </button>

              {testSuccess && (
                <span className="talkora-test-success-msg">
                  <Check size={16} /> Voice tested successfully!
                </span>
              )}
            </div>
          </div>

          {/* Item 2: Privacy & Safety */}
          <div className="talkora-settings-card">
            <div className="talkora-settings-card__header">
              <div className="talkora-settings-card__icon safety">
                <ShieldCheck size={20} />
              </div>
              <div className="talkora-settings-card__text">
                <h3>Privacy & Child Safety</h3>
                <p>Your account uses school-managed access and role-based controls.</p>
              </div>
            </div>
          </div>

          {/* Item 3: Help & Support */}
          <div className="talkora-settings-card">
            <div className="talkora-settings-card__header">
              <div className="talkora-settings-card__icon help">
                <HelpCircle size={20} />
              </div>
              <div className="talkora-settings-card__text">
                <h3>Help & Support</h3>
                <p>Ask your teacher or school administrator for PIN resets.</p>
              </div>
            </div>
          </div>

          {/* Item 4: Log Out */}
          <button
            type="button"
            className="talkora-logout-btn"
            onClick={handleLogout}
          >
            <DoorOpen size={20} />
            <span>Log Out of Talkora</span>
          </button>
        </div>
      </div>
    </motion.div>
  )
}
