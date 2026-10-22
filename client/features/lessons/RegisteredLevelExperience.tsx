'use client'

import { lazy, Suspense, type ComponentType, type LazyExoticComponent, type ReactNode } from 'react'
import {
  loadStudentWorkspace,
  loadWorkspace,
  workspaceId,
  type LevelExperienceProps,
} from './registry'

const studentEntries = new Map<string, LazyExoticComponent<ComponentType<LevelExperienceProps>>>()
const staffEntries = new Map<string, LazyExoticComponent<ComponentType<LevelExperienceProps>>>()

function registeredExperience(grade: number, level: number, staffPreview: boolean) {
  const id = workspaceId(grade, level)
  if (!id) return null
  const cache = staffPreview ? staffEntries : studentEntries
  const cached = cache.get(id)
  if (cached) return cached
  const Experience = lazy(async () => {
    const workspace = staffPreview ? await loadWorkspace(grade, level) : await loadStudentWorkspace(grade, level)
    if (!workspace) throw new Error(`Curriculum workspace ${id} does not exist`)
    return { default: workspace.LevelExperience }
  })
  cache.set(id, Experience)
  return Experience
}

/** The single rendering bridge from a stable 110-level address to its canonical module. */
export function RegisteredLevelExperience({
  grade,
  level,
  staffPreview = false,
  experienceProps,
  fallback = null,
}: {
  grade: number
  level: number
  staffPreview?: boolean
  experienceProps?: LevelExperienceProps
  fallback?: ReactNode
}) {
  const Experience = registeredExperience(grade, level, staffPreview)
  if (!Experience) return fallback
  return <Suspense fallback={fallback}><Experience {...experienceProps} /></Suspense>
}
