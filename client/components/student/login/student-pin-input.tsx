'use client'

import { motion } from 'framer-motion'

export function StudentPinInput({ value, onChange, invalid = false, success = false, length = 4 }: { value: string; onChange: (value: string) => void; invalid?: boolean; success?: boolean; length?: number }) {
  const slots = Array.from({ length: Math.max(length, value.length) }, (_, index) => value[index] || '')
  return <label className={`student-pin ${invalid ? 'invalid' : ''} ${success ? 'success' : ''}`}>
    <span className="sr-only">Secret student code</span>
    <input autoFocus required value={value} maxLength={12} autoComplete="one-time-code" onChange={(event) => onChange(event.target.value.toUpperCase().replace(/\s/g, ''))} />
    <span className="student-pin-slots" aria-hidden="true">{slots.map((character, index) => <motion.i key={index} animate={character ? { scale: [0.75, 1.08, 1] } : { scale: 1 }} transition={{ duration: 0.24 }}>{character || '•'}</motion.i>)}</span>
  </label>
}
