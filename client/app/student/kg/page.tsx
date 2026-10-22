'use client'

import { LoaderCircle } from 'lucide-react'
import { RegisteredLevelExperience } from '@/features/lessons/RegisteredLevelExperience'

/** Thin route wrapper: KG -> Level 1 -> the canonical 110-level registry entry. */
export default function KGAlphabetLessonPage() {
  return <RegisteredLevelExperience
    grade={0}
    level={1}
    fallback={<main className="kg-alpha kg-alpha-loading"><LoaderCircle className="kg-spin" size={24} /> Opening your garden...</main>}
  />
}
