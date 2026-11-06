import React from 'react'

export type StatusVariant =
  | 'active'
  | 'inactive'
  | 'on-track'
  | 'needs-support'
  | 'published'
  | 'draft'
  | 'incomplete'
  | 'archived'
  | 'suspended'

interface StatusBadgeProps {
  status: string
  variant?: StatusVariant
  size?: 'sm' | 'md'
}

const BADGE_CONFIG: Record<
  StatusVariant,
  { label: string; bg: string; color: string; dot: string }
> = {
  active: {
    label: 'Active',
    bg: '#ecfdf5',
    color: '#065f46',
    dot: '#10b981',
  },
  inactive: {
    label: 'Inactive',
    bg: '#f8fafc',
    color: '#64748b',
    dot: '#94a3b8',
  },
  'on-track': {
    label: 'On Track',
    bg: '#ecfdf5',
    color: '#047857',
    dot: '#10b981',
  },
  'needs-support': {
    label: 'Needs Attention',
    bg: '#fff7ed',
    color: '#c2410c',
    dot: '#f97316',
  },
  published: {
    label: 'Published',
    bg: '#eff6ff',
    color: '#1d4ed8',
    dot: '#3b82f6',
  },
  draft: {
    label: 'Draft',
    bg: '#fefce8',
    color: '#a16207',
    dot: '#eab308',
  },
  incomplete: {
    label: 'Incomplete',
    bg: '#fdf2f8',
    color: '#be185d',
    dot: '#ec4899',
  },
  archived: {
    label: 'Archived',
    bg: '#f1f5f9',
    color: '#475569',
    dot: '#64748b',
  },
  suspended: {
    label: 'Suspended',
    bg: '#fef2f2',
    color: '#b91c1c',
    dot: '#ef4444',
  },
}

function resolveVariant(status: string): StatusVariant {
  const normalized = status.toLowerCase().replace(/_/g, '-')
  if (normalized.includes('active') && !normalized.includes('in')) return 'active'
  if (normalized.includes('inactive')) return 'inactive'
  if (normalized.includes('publish')) return 'published'
  if (normalized.includes('draft')) return 'draft'
  if (normalized.includes('incomplete')) return 'incomplete'
  if (normalized.includes('archive')) return 'archived'
  if (normalized.includes('suspend')) return 'suspended'
  if (normalized.includes('track') || normalized.includes('good')) return 'on-track'
  if (normalized.includes('support') || normalized.includes('need') || normalized.includes('attention')) return 'needs-support'
  return 'inactive'
}

export function StatusBadge({ status, variant, size = 'sm' }: StatusBadgeProps) {
  const chosenVariant = variant || resolveVariant(status)
  const config = BADGE_CONFIG[chosenVariant] || BADGE_CONFIG.inactive

  const isSmall = size === 'sm'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSmall ? 5 : 7,
        padding: isSmall ? '2px 8px' : '4px 10px',
        borderRadius: 999,
        background: config.bg,
        color: config.color,
        fontSize: isSmall ? 11 : 12,
        fontWeight: 700,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: isSmall ? 6 : 8,
          height: isSmall ? 6 : 8,
          borderRadius: '50%',
          background: config.dot,
        }}
        aria-hidden="true"
      />
      {status || config.label}
    </span>
  )
}

