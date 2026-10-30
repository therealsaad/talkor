'use client'
import type { FormEvent, ReactNode } from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart3, BookOpen, Bot, ChevronLeft, GraduationCap, LayoutDashboard, LogOut, Menu, Search, Settings, Sparkles, Users, X, Shapes, Layers3, ShieldCheck, UserCheck } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { TalkoraLogo } from '@/components/brand/talkora-logo'
import { educatorAIService, type EducatorAIResponse } from '@/services/educator-ai-service'

interface NavItem {
  href: string
  label: string
  teacherLabel?: string
  icon: typeof LayoutDashboard
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { href: '/school/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/school/students', label: 'Students', icon: Users },
  { href: '/school/classes', label: 'Classes', teacherLabel: 'My Classes', icon: GraduationCap },
  { href: '/school/curriculum-map', label: '110-Level Map', icon: Layers3 },
  { href: '/school/kg-preview', label: 'KG Previews', icon: Shapes },
  { href: '/school/teachers', label: 'Teachers', icon: BookOpen, adminOnly: true },
  { href: '/school/reports', label: 'Learning Progress', teacherLabel: 'Learning Progress', icon: BarChart3 },
  { href: '/school/settings', label: 'Settings', teacherLabel: 'My Account', icon: Settings },
]

export function SchoolShell({
  children,
  title,
  subtitle,
  workspaceClassName,
}: {
  children: ReactNode
  title: string
  subtitle?: string
  workspaceClassName?: string
}) {
  const path = usePathname()
  const router = useRouter()
  const { session, logout } = useAuth()
  const [menu, setMenu] = useState(false)
  const [ai, setAi] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<EducatorAIResponse | null>(null)
  const [assistantError, setAssistantError] = useState('')
  const [assistantBusy, setAssistantBusy] = useState(false)

  const isTeacher = session?.role === 'TEACHER'
  const name = session?.user?.name || (isTeacher ? 'Teacher' : 'School Administrator')
  const school = session?.school?.name || 'Talkora School'
  const roleLabel = isTeacher ? 'Teacher' : 'School Admin'

  async function askAssistant(message: string) {
    if (!message.trim() || assistantBusy) return
    setQuestion(message)
    setAnswer(null)
    setAssistantError('')
    setAssistantBusy(true)
    try {
      setAnswer(await educatorAIService.ask(message))
    } catch (error) {
      setAssistantError(error instanceof Error ? error.message : 'Talkora AI could not answer. Try again.')
    } finally {
      setAssistantBusy(false)
    }
  }

  function submitAssistant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void askAssistant(question)
  }

  const visibleNav = navItems.filter((item) => !item.adminOnly || !isTeacher)

  return (
    <div className={`educator-shell ${menu ? 'menu-open' : ''}`}>
      <aside className="educator-sidebar">
        <div className="educator-logo">
          <TalkoraLogo className="talkora-logo--educator" priority />
          <button onClick={() => setMenu(false)} aria-label="Close navigation">
            <ChevronLeft />
          </button>
        </div>

        <div style={{ padding: '0 8px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 12 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: isTeacher ? '#7dd3fc' : '#ffd83d',
              background: 'rgba(255,255,255,0.06)',
              padding: '3px 8px',
              borderRadius: 6,
            }}
          >
            {isTeacher ? <UserCheck size={11} /> : <ShieldCheck size={11} />}
            {roleLabel} Portal
          </span>
        </div>

        <nav>
          {visibleNav.map((item) => {
            const Icon = item.icon
            const label = isTeacher && 'teacherLabel' in item && item.teacherLabel ? item.teacherLabel : item.label
            const active = path.startsWith(item.href)
            return (
              <Link
                className={active ? 'active' : ''}
                href={item.href}
                key={item.href}
                onClick={() => setMenu(false)}
              >
                <Icon />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        <button className="educator-ai-launch" onClick={() => setAi(true)}>
          <Sparkles />
          <span>
            <b>Talkora AI</b>
            <small>Educator assistant</small>
          </span>
        </button>

        <div className="educator-account">
          <span>{name.slice(0, 2).toUpperCase()}</span>
          <div>
            <b>{name}</b>
            <small>{school}</small>
          </div>
          <button
            aria-label="Log out"
            title="Log out of Talkora"
            onClick={async () => {
              await logout()
              router.replace(isTeacher ? '/login/teacher' : '/login/school')
            }}
          >
            <LogOut />
          </button>
        </div>
      </aside>

      {menu && <button className="educator-scrim" aria-label="Close navigation" onClick={() => setMenu(false)} />}

      <div className="educator-main">
        <header className="educator-topbar">
          <button className="educator-menu" onClick={() => setMenu(true)} aria-label="Open navigation">
            <Menu />
          </button>
          <Link className="educator-search" href="/school/students">
            <Search />
            <span>Search enrolled students…</span>
          </Link>
          <button className="educator-ai-mobile" onClick={() => setAi(true)}>
            <Sparkles /> Ask Talkora AI
          </button>
          <div className="educator-user" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ cursor: 'default' }}>{name.slice(0, 2).toUpperCase()}</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }} className="educator-user-details">
              <strong style={{ fontSize: 13, color: '#0f172a', lineHeight: 1.2 }}>{name}</strong>
              <small style={{ fontSize: 11, color: '#64748b' }}>{school} · {roleLabel}</small>
            </div>
          </div>
        </header>

        <main className={`educator-workspace${workspaceClassName ? ` ${workspaceClassName}` : ''}`}>
          <div className="educator-page-head">
            <div>
              <small>{isTeacher ? `Teacher Workspace · ${name}` : `${school} · School Management`}</small>
              <h1>{title}</h1>
              {subtitle && <p>{subtitle}</p>}
            </div>
          </div>
          {children}
        </main>
      </div>

      <aside className={`educator-ai-panel ${ai ? 'open' : ''}`} aria-hidden={!ai}>
        <header>
          <div>
            <Sparkles />
            <span>
              <b>Talkora AI</b>
              <small>Educator Assistant</small>
            </span>
          </div>
          <button onClick={() => setAi(false)} aria-label="Close assistant">
            <X />
          </button>
        </header>
        <div className="educator-ai-body" style={{ overflowY: 'auto', flex: 1 }}>
          <div className="ai-orb">
            <Bot />
          </div>
          <h2>How can I help?</h2>
          <p>Ask about Talkora curriculum, teaching strategies, or student progress insights.</p>
          <div className="ai-chips">
            {['Summarize class progress', 'Which students need attention?', 'What skill gaps are recorded?'].map((item) => (
              <button type="button" key={item} disabled={assistantBusy} onClick={() => void askAssistant(item)}>
                {item}
              </button>
            ))}
          </div>
          {assistantBusy ? <p role="status">Reviewing your question…</p> : null}
          {assistantError ? (
            <p role="alert" style={{ color: '#a43b35' }}>
              {assistantError}
            </p>
          ) : null}
          {answer ? (
            <div aria-live="polite" style={{ marginTop: 22, display: 'grid', gap: 14 }}>
              <section>
                <h3 style={{ fontSize: 14, margin: '0 0 6px' }}>Answer</h3>
                <p style={{ color: '#334155', fontSize: 13, lineHeight: 1.5, margin: 0 }}>{answer.summary}</p>
              </section>
              {answer.insights.map((item, index) => (
                <section key={`${item.title}-${index}`} style={{ background: '#f5f7fb', borderRadius: 10, padding: 12 }}>
                  <b style={{ fontSize: 12 }}>{item.title}</b>
                  <p style={{ color: '#475569', fontSize: 12, lineHeight: 1.5, margin: '5px 0 0' }}>{item.detail}</p>
                </section>
              ))}
              {answer.actions.length ? (
                <section>
                  <h3 style={{ fontSize: 14 }}>Suggested actions</h3>
                  {answer.actions.map((item, index) => (
                    <p key={`${item.label}-${index}`} style={{ color: '#475569', fontSize: 12 }}>
                      <b>{item.label}</b> — {item.reason}
                    </p>
                  ))}
                </section>
              ) : null}
              {answer.followUpSuggestions.length ? (
                <div className="ai-chips">
                  {answer.followUpSuggestions.map((item) => (
                    <button type="button" key={item} disabled={assistantBusy} onClick={() => void askAssistant(item)}>
                      {item}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        <form className="educator-ai-input" onSubmit={submitAssistant}>
          <input
            aria-label="Ask Talkora AI"
            placeholder="Ask anything about Talkora or teaching…"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            disabled={assistantBusy}
          />
          <button aria-label="Send" disabled={assistantBusy || !question.trim()}>
            <Sparkles />
          </button>
        </form>
      </aside>
    </div>
  )
}
