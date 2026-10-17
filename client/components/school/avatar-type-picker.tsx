'use client'

import { motion } from 'framer-motion'
import { LearnerCharacter } from '@/components/student/learner-character'

export function AvatarTypePicker({ value, onChange }: { value: 'BOY' | 'GIRL'; onChange: (value: 'BOY' | 'GIRL') => void }) {
  return <fieldset className="avatar-type-picker"><legend>Choose the learner character</legend><div>
    {(['BOY', 'GIRL'] as const).map((type) => <motion.button key={type} type="button" className={value === type ? 'selected' : ''} aria-pressed={value === type} onClick={() => onChange(type)} whileHover={{ y: -4 }} whileTap={{ scale: .97 }}>
      <LearnerCharacter avatarType={type} state={value === type ? 'happy' : 'idle'} size="small" />
      <strong>Talkora {type === 'BOY' ? 'Boy' : 'Girl'}</strong><span>{value === type ? 'Selected' : 'Choose'}</span>
    </motion.button>)}
  </div></fieldset>
}
