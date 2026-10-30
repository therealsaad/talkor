import React, { type ReactNode } from 'react'
import { LucideIcon, FolderSearch } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: LucideIcon
  action?: ReactNode
}

export function EmptyState({
  title,
  description,
  icon: Icon = FolderSearch,
  action,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        background: '#ffffff',
        border: '1px dashed #cbd5e1',
        borderRadius: 16,
        margin: '16px 0',
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: '#f1f5f9',
          color: '#64748b',
          display: 'grid',
          placeItems: 'center',
          marginBottom: 16,
        }}
      >
        <Icon size={26} strokeWidth={1.8} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 750, color: '#0f172a', margin: '0 0 6px' }}>
        {title}
      </h3>
      {description ? (
        <p style={{ fontSize: 13, color: '#64748b', maxWidth: 440, margin: '0 0 18px', lineHeight: 1.5 }}>
          {description}
        </p>
      ) : null}
      {action ? <div>{action}</div> : null}
    </div>
  )
}

