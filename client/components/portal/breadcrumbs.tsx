import React from 'react'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumbs" style={{ marginBottom: 14 }}>
      <ol
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          listStyle: 'none',
          padding: 0,
          margin: 0,
          fontSize: 12,
          fontWeight: 600,
          color: '#64748b',
          flexWrap: 'wrap',
        }}
      >
        <li>
          <Link
            href="/school/dashboard"
            style={{
              color: '#64748b',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Home size={13} />
            <span>Portal</span>
          </Link>
        </li>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1
          return (
            <React.Fragment key={`${item.label}-${idx}`}>
              <li aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', color: '#94a3b8' }}>
                <ChevronRight size={13} />
              </li>
              <li>
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    style={{
                      color: '#64748b',
                      textDecoration: 'none',
                    }}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span style={{ color: '#0f172a', fontWeight: 700 }} aria-current={isLast ? 'page' : undefined}>
                    {item.label}
                  </span>
                )}
              </li>
            </React.Fragment>
          )
        })}
      </ol>
    </nav>
  )
}

