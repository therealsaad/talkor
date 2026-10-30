import React, { type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowUpRight, LucideIcon } from 'lucide-react'

export interface MetricCardProps {
  label: string
  value: string | number
  subtext?: string
  trend?: string
  icon?: LucideIcon
  accent?: 'indigo' | 'emerald' | 'amber' | 'sky' | 'purple' | 'slate'
  href?: string
  onClick?: () => void
  loading?: boolean
}

const ACCENT_STYLES = {
  indigo: {
    iconBg: '#eef2ff',
    iconColor: '#4f46e5',
    pillBg: '#e0e7ff',
    pillColor: '#3730a3',
  },
  emerald: {
    iconBg: '#ecfdf5',
    iconColor: '#059669',
    pillBg: '#d1fae5',
    pillColor: '#065f46',
  },
  amber: {
    iconBg: '#fffbeb',
    iconColor: '#d97706',
    pillBg: '#fef3c7',
    pillColor: '#92400e',
  },
  sky: {
    iconBg: '#f0f9ff',
    iconColor: '#0284c7',
    pillBg: '#e0f2fe',
    pillColor: '#0369a1',
  },
  purple: {
    iconBg: '#faf5ff',
    iconColor: '#9333ea',
    pillBg: '#f3e8ff',
    pillColor: '#6b21a8',
  },
  slate: {
    iconBg: '#f8fafc',
    iconColor: '#475569',
    pillBg: '#f1f5f9',
    pillColor: '#334155',
  },
}

export function MetricCard({
  label,
  value,
  subtext,
  trend,
  icon: Icon,
  accent = 'indigo',
  href,
  onClick,
  loading = false,
}: MetricCardProps) {
  const styles = ACCENT_STYLES[accent] || ACCENT_STYLES.indigo

  const content = (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        padding: '20px 22px',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        height: '100%',
        transition: 'transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease',
        cursor: href || onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {label}
        </span>
        {Icon ? (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: styles.iconBg,
              color: styles.iconColor,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={18} strokeWidth={2.2} />
          </div>
        ) : href ? (
          <ArrowUpRight size={16} color="#94a3b8" />
        ) : null}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        {loading ? (
          <div
            style={{
              height: 36,
              width: 80,
              borderRadius: 8,
              background: '#f1f5f9',
              animation: 'pulse 1.5s infinite',
            }}
          />
        ) : (
          <span
            style={{
              fontSize: 32,
              fontWeight: 850,
              color: '#0f172a',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
          >
            {value}
          </span>
        )}
        {trend ? (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 7px',
              borderRadius: 6,
              background: styles.pillBg,
              color: styles.pillColor,
            }}
          >
            {trend}
          </span>
        ) : null}
      </div>

      {subtext ? (
        <span style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{subtext}</span>
      ) : null}
    </div>
  )

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          border: 'none',
          background: 'transparent',
          padding: 0,
          textAlign: 'left',
          width: '100%',
          cursor: 'pointer',
        }}
      >
        {content}
      </button>
    )
  }

  return content
}

