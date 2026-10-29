'use client'
import type { FormEvent, ReactNode } from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart3, BookOpen, Bot, ChevronLeft, GraduationCap, LayoutDashboard, LogOut, Menu, Search, Settings, Sparkles, Users, X, Shapes, Layers3 } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { TalkoraLogo } from '@/components/brand/talkora-logo'
import { educatorAIService, type EducatorAIResponse } from '@/services/educator-ai-service'

const nav = [
  ['/school/dashboard', 'Overview', LayoutDashboard], ['/school/students', 'Students', Users], ['/school/kg-preview', 'KG Preview', Shapes], ['/school/classes', 'Classes', GraduationCap], ['/school/curriculum-map', '110-Level Map', Layers3], ['/school/teachers', 'Teachers', BookOpen], ['/school/reports', 'Reports', BarChart3], ['/school/settings', 'Settings', Settings],
] as const

export function SchoolShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const path = usePathname(); const router = useRouter(); const { session, logout } = useAuth(); const [menu, setMenu] = useState(false); const [ai, setAi] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<EducatorAIResponse | null>(null)
  const [assistantError, setAssistantError] = useState('')
  const [assistantBusy, setAssistantBusy] = useState(false)
  async function askAssistant(message: string) {
    if (!message.trim() || assistantBusy) return
    setQuestion(message)
    setAnswer(null)
    setAssistantError('')
    setAssistantBusy(true)
    try { setAnswer(await educatorAIService.ask(message)) }
    catch (error) { setAssistantError(error instanceof Error ? error.message : 'Talkora AI could not answer. Try again.') }
    finally { setAssistantBusy(false) }
  }
  function submitAssistant(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void askAssistant(question) }
  const name = session?.user?.name || (session?.role === 'TEACHER' ? 'Teacher' : 'School Admin'); const school = session?.school?.name || 'Talkora School'; const visibleNav = session?.role === 'TEACHER' ? nav.filter(([href]) => href !== '/school/teachers') : nav
  return <div className={`educator-shell ${menu ? 'menu-open' : ''}`}>
    <aside className="educator-sidebar"><div className="educator-logo"><TalkoraLogo className="talkora-logo--educator" priority /><button onClick={() => setMenu(false)} aria-label="Close navigation"><ChevronLeft/></button></div><nav>{visibleNav.map(([href,label,Icon]) => <Link className={path.startsWith(href) ? 'active' : ''} href={href} key={href}><Icon/><span>{label}</span></Link>)}</nav><button className="educator-ai-launch" onClick={() => setAi(true)}><Sparkles/><span><b>Talkora AI</b><small>Educator assistant</small></span></button><div className="educator-account"><span>{name.slice(0,2).toUpperCase()}</span><div><b>{name}</b><small>{school}</small></div><button aria-label="Log out" onClick={async () => { await logout(); router.replace(session?.role === 'TEACHER' ? '/login/teacher' : '/login/school') }}><LogOut/></button></div></aside>
    {menu && <button className="educator-scrim" aria-label="Close navigation" onClick={() => setMenu(false)}/>}<div className="educator-main"><header className="educator-topbar"><button className="educator-menu" onClick={() => setMenu(true)} aria-label="Open navigation"><Menu/></button><Link className="educator-search" href="/school/students"><Search/><span>Find students</span></Link><button className="educator-ai-mobile" onClick={() => setAi(true)}><Sparkles/> Ask Talkora AI</button><div className="educator-user"><span>{name.slice(0,2).toUpperCase()}</span></div></header><main className="educator-workspace"><div className="educator-page-head"><div><small>{session?.role === 'TEACHER' ? 'Teacher workspace' : school}</small><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div></div>{children}</main></div>
    <aside className={`educator-ai-panel ${ai ? 'open' : ''}`} aria-hidden={!ai}><header><div><Sparkles/><span><b>Talkora AI</b><small>Educator Assistant</small></span></div><button onClick={() => setAi(false)} aria-label="Close assistant"><X/></button></header><div className="educator-ai-body" style={{ overflowY: 'auto', flex: 1 }}><div className="ai-orb"><Bot/></div><h2>How can I help?</h2><p>Ask about Talkora, teaching, education, or your classroom.</p><div className="ai-chips">{['Summarize class progress','Which students need attention?','What skill gaps are recorded?'].map((item) => <button type="button" key={item} disabled={assistantBusy} onClick={() => void askAssistant(item)}>{item}</button>)}</div>{assistantBusy ? <p role="status">Reviewing your question…</p> : null}{assistantError ? <p role="alert" style={{ color: '#a43b35' }}>{assistantError}</p> : null}{answer ? <div aria-live="polite" style={{ marginTop: 22, display: 'grid', gap: 14 }}><section><h3 style={{ fontSize: 14, margin: '0 0 6px' }}>Answer</h3><p style={{ color: '#334155', fontSize: 13, lineHeight: 1.5, margin: 0 }}>{answer.summary}</p></section>{answer.insights.map((item, index) => <section key={`${item.title}-${index}`} style={{ background: '#f5f7fb', borderRadius: 10, padding: 12 }}><b style={{ fontSize: 12 }}>{item.title}</b><p style={{ color: '#475569', fontSize: 12, lineHeight: 1.5, margin: '5px 0 0' }}>{item.detail}</p></section>)}{answer.actions.length ? <section><h3 style={{ fontSize: 14 }}>Suggested actions</h3>{answer.actions.map((item, index) => <p key={`${item.label}-${index}`} style={{ color: '#475569', fontSize: 12 }}><b>{item.label}</b> — {item.reason}</p>)}</section> : null}{answer.followUpSuggestions.length ? <div className="ai-chips">{answer.followUpSuggestions.map((item) => <button type="button" key={item} disabled={assistantBusy} onClick={() => void askAssistant(item)}>{item}</button>)}</div> : null}</div> : null}</div><form className="educator-ai-input" onSubmit={submitAssistant}><input aria-label="Ask Talkora AI" placeholder="Ask anything about Talkora or teaching…" value={question} onChange={(event) => setQuestion(event.target.value)} disabled={assistantBusy}/><button aria-label="Send" disabled={assistantBusy || !question.trim()}><Sparkles/></button></form></aside>
  </div>
}
