'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  GraduationCap,
  School,
  Sparkles,
} from 'lucide-react'
import { cardMotion, pageVariants } from '@/motion/presets'
import { talkoraAssets } from '@/config/talkora-assets'
import { TalkoraLogo } from '@/components/brand/talkora-logo'

export default function RoleSelectionPage() {
  const roles = [
    {
      id: 'student',
      title: "I'm a Student",
      subtitle: 'Start your speaking adventure with Miss Julie',
      icon: BookOpen,
      href: '/login/student',
      color: '#38BDF8',
      image: talkoraAssets.students.BOY,
      buttonText: 'Student Adventure',
      theme: 'student',
    },
    {
      id: 'teacher',
      title: "I'm a Teacher",
      subtitle: 'Guide classes, view progress & assign units',
      icon: GraduationCap,
      href: '/login/teacher',
      color: '#8B5CF6',
      image: talkoraAssets.julie.standing,
      buttonText: 'Teacher Portal',
      theme: 'teacher',
    },
    {
      id: 'school',
      title: "I'm a School Admin",
      subtitle: 'Manage classes, student rosters & school insights',
      icon: School,
      href: '/login/school',
      color: '#10B981',
      image: talkoraAssets.environments.school,
      buttonText: 'School Admin',
      theme: 'school',
    },
  ]

  return (
    <motion.main
      className="talkora-role-select-page"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="talkora-role-select-glow" aria-hidden="true" />

      <header className="talkora-role-header">
        <Link href="/" className="talkora-brand-mark">
          <TalkoraLogo className="talkora-logo--header" priority />
        </Link>
      </header>

      <section className="talkora-role-content">
        <span className="talkora-kicker">
          <Sparkles size={16} /> WELCOME TO TALKORA
        </span>
        <h1 className="talkora-role-title">Choose Your Role</h1>
        <p className="talkora-role-subtitle">
          Select how you are signing into the Talkora English learning universe.
        </p>

        {/* 3 Role Cards Grid (Reference Image 1 Screen 2) */}
        <div className="talkora-roles-grid">
          {roles.map((role) => (
            <motion.div
              key={role.id}
              variants={cardMotion}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
            >
              <Link
                href={role.href}
                className={`talkora-role-card talkora-role-card--${role.theme}`}
              >
                <div className="talkora-role-card__art">
                  <Image
                    src={role.image}
                    alt={role.title}
                    width={180}
                    height={220}
                    className="talkora-role-img"
                  />
                </div>

                <div className="talkora-role-card__meta">
                  <h2>{role.title}</h2>
                  <p>{role.subtitle}</p>
                </div>

                <div className="talkora-role-card__action">
                  <span>{role.buttonText}</span>
                  <ArrowRight size={18} />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <Link href="/" className="talkora-back-link">
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>
      </section>
    </motion.main>
  )
}
