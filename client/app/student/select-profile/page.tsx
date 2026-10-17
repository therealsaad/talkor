'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Sparkles, User, UserCheck } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { talkoraAssets } from '@/config/talkora-assets'
import { cardMotion, pageVariants, springBouncy } from '@/motion/presets'
import { TalkoraLogo } from '@/components/brand/talkora-logo'

interface AvatarOption {
  id: string
  name: string
  gender: 'boy' | 'girl'
  image: string
  tagline: string
  avatarType: 'BOY' | 'GIRL'
}

const AVATAR_OPTIONS: AvatarOption[] = [
  // Boys
  { id: 'aarav', name: 'Aarav', gender: 'boy', image: '/avatars/aarav.png', tagline: 'School Ready & Eager', avatarType: 'BOY' },
  { id: 'kabir', name: 'Kabir', gender: 'boy', image: '/avatars/kabir.png', tagline: 'Curious & Inquisitive', avatarType: 'BOY' },
  { id: 'rehan', name: 'Rehan', gender: 'boy', image: '/avatars/aarav.png', tagline: 'Calm & Friendly', avatarType: 'BOY' },
  { id: 'vihaan', name: 'Vihaan', gender: 'boy', image: '/avatars/kabir.png', tagline: 'Energetic Gamer', avatarType: 'BOY' },
  { id: 'arjun', name: 'Arjun', gender: 'boy', image: '/avatars/rahul.png', tagline: 'Team Player & Sporty', avatarType: 'BOY' },
  { id: 'ibrahim', name: 'Ibrahim', gender: 'boy', image: '/avatars/aarav.png', tagline: 'Book Explorer', avatarType: 'BOY' },
  // Girls
  { id: 'anaya', name: 'Anaya', gender: 'girl', image: '/avatars/ananya.png', tagline: 'Joyful & Creative', avatarType: 'GIRL' },
  { id: 'zara', name: 'Zara', gender: 'girl', image: '/avatars/ananya.png', tagline: 'Warm & Inclusive', avatarType: 'GIRL' },
  { id: 'myra', name: 'Myra', gender: 'girl', image: '/avatars/sara.png', tagline: 'Cheerful & Bright', avatarType: 'GIRL' },
  { id: 'aisha', name: 'Aisha', gender: 'girl', image: '/avatars/ananya.png', tagline: 'Enthusiastic Thinker', avatarType: 'GIRL' },
  { id: 'diya', name: 'Diya', gender: 'girl', image: '/avatars/meera.png', tagline: 'Story Explorer', avatarType: 'GIRL' },
  { id: 'sara', name: 'Sara', gender: 'girl', image: '/avatars/sara.png', tagline: 'Confident Speaker', avatarType: 'GIRL' },
  { id: 'pari', name: 'Pari', gender: 'girl', image: '/avatars/sara.png', tagline: 'Playful & Brave', avatarType: 'GIRL' },
]

export default function StudentAvatarSelectPage() {
  const router = useRouter()
  const { session, updateStudentAvatar } = useAuth()
  const [selectedAvatar, setSelectedAvatar] = useState<string>('arjun')
  const [genderFilter, setGenderFilter] = useState<'all' | 'boy' | 'girl'>('all')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (session?.student?.avatar) {
        setSelectedAvatar(session.student.avatar.toLowerCase())
      }
  }, [session?.student?.avatar])

  const filteredAvatars = AVATAR_OPTIONS.filter((a) =>
    genderFilter === 'all' ? true : a.gender === genderFilter
  )

  const activeAvatar = AVATAR_OPTIONS.find((a) => a.id === selectedAvatar) || AVATAR_OPTIONS[0]

  const handleSelectAvatar = async (option: AvatarOption) => {
    setSelectedAvatar(option.id)
    setSaving(true)
    try {
      await updateStudentAvatar(option.id, option.avatarType)
    } finally {
      setSaving(false)
    }
  }

  const handleConfirm = () => {
    router.push('/student/home')
  }

  return (
    <motion.main
      className="talkora-avatar-select-page"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="talkora-avatar-select-glow" aria-hidden="true" />

      {/* Header */}
      <header className="talkora-avatar-select-header">
        <Link href="/student/home" className="talkora-back-link">
          <ArrowLeft size={18} />
          <span>Back to Home</span>
        </Link>
        <div className="talkora-brand-mark">
          <TalkoraLogo className="talkora-logo--header" priority />
        </div>
      </header>

      <section className="talkora-avatar-select-content">
        <div className="talkora-avatar-select-title-wrap">
          <span className="talkora-kicker">
            <Sparkles size={16} /> CHOOSE YOUR ADVENTURE BUDDY
          </span>
          <h1 className="talkora-avatar-select-title">Choose your avatar, {session?.student?.fullName || 'Explorer'}</h1>
          <p className="talkora-avatar-select-subtitle">
            Pick your 3D avatar buddy for your English speaking missions with Miss Julie!
          </p>
        </div>

        {/* Gender Filter Pills */}
        <div className="talkora-avatar-filters">
          <button
            type="button"
            className={`talkora-filter-pill ${genderFilter === 'all' ? 'is-active' : ''}`}
            onClick={() => setGenderFilter('all')}
          >
            All Buddies ({AVATAR_OPTIONS.length})
          </button>
          <button
            type="button"
            className={`talkora-filter-pill ${genderFilter === 'boy' ? 'is-active' : ''}`}
            onClick={() => setGenderFilter('boy')}
          >
            Boys ({AVATAR_OPTIONS.filter((a) => a.gender === 'boy').length})
          </button>
          <button
            type="button"
            className={`talkora-filter-pill ${genderFilter === 'girl' ? 'is-active' : ''}`}
            onClick={() => setGenderFilter('girl')}
          >
            Girls ({AVATAR_OPTIONS.filter((a) => a.gender === 'girl').length})
          </button>
        </div>

        {/* Avatars Grid (Reference Image 3) */}
        <div className="talkora-avatar-grid">
          {filteredAvatars.map((option) => {
            const isSelected = selectedAvatar === option.id
            return (
              <motion.button
                key={option.id}
                type="button"
                className={`talkora-avatar-card ${isSelected ? 'is-selected' : ''}`}
                variants={cardMotion}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                onClick={() => handleSelectAvatar(option)}
              >
                {isSelected && (
                  <motion.span
                    className="talkora-avatar-check-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={springBouncy}
                  >
                    <Check size={14} />
                  </motion.span>
                )}

                <div className="talkora-avatar-card__img-wrap">
                  <Image
                    src={option.image}
                    alt={option.name}
                    width={84}
                    height={84}
                    className="talkora-avatar-card__img"
                  />
                </div>

                <div className="talkora-avatar-card__meta">
                  <h3>{option.name}</h3>
                  <small>{option.tagline}</small>
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Selected Confirmation Banner */}
        <div className="talkora-avatar-confirm-dock">
          <div className="talkora-avatar-preview-pill">
            <Image
              src={activeAvatar.image}
              alt={activeAvatar.name}
              width={48}
              height={48}
              className="talkora-preview-img"
            />
            <div className="talkora-preview-meta">
              <strong>Avatar: {activeAvatar.name}</strong>
              <small>{activeAvatar.tagline}</small>
            </div>
          </div>

          <button
            type="button"
            className="talkora-primary-cta-btn"
            onClick={handleConfirm}
            disabled={saving}
          >
            <span>Continue Adventure</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </section>
    </motion.main>
  )
}
