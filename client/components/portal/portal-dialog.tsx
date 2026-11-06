import React, { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface PortalDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  maxWidth?: number
}

export function PortalDialog({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 540,
}: PortalDialogProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="portal-dialog-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          background: '#ffffff',
          borderRadius: 20,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div>
            <h2 id="portal-dialog-title" style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {title}
            </h2>
            {subtitle ? (
              <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
                {subtitle}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              border: 'none',
              background: '#f1f5f9',
              borderRadius: 8,
              width: 32,
              height: 32,
              display: 'grid',
              placeItems: 'center',
              color: '#64748b',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  )
}

