'use client'

import { useState } from 'react'
import { getApiUrl, getStoredToken, handleUnauthorizedResponse } from '@/lib/api-client'

type Period = 'daily' | 'weekly' | 'monthly'

/** Deliberately page-bounded: no 10,000-child CSV held in a browser tab. */
export function ReportCsvDownload() {
  const [period, setPeriod] = useState<Period>('weekly')
  const [cursor, setCursor] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [downloaded, setDownloaded] = useState(false)

  const download = async () => {
    const token = getStoredToken()
    if (!token) { setError('Sign in as a school administrator or teacher to download reports.'); return }
    setBusy(true); setError('')
    try {
      const query = new URLSearchParams({ period, limit: '30' })
      if (cursor) query.set('after', cursor)
      const response = await fetch(getApiUrl(`/analytics/reports/export.csv?${query.toString()}`), {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
      })
      if (!response.ok) {
        handleUnauthorizedResponse(response.status)
        throw new Error(`Report export failed (${response.status}). Please check your permissions.`)
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url; anchor.download = `talkora-${period}-reports-page-${page}.csv`
      document.body.append(anchor); anchor.click(); anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
      setNextCursor(response.headers.get('X-Talkora-Next-Cursor'))
      setDownloaded(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not export reports')
    } finally { setBusy(false) }
  }
  return <section aria-label="Download school progress reports" style={{ background: '#fff', border: '1px solid #e5e8ef', borderRadius: 16, padding: 18, marginTop: 18 }}>
    <h2 style={{ fontSize: 16, margin: '0 0 10px' }}>Download learning reports (CSV)</h2>
    <p style={{ fontSize: 12, color: '#69728a' }}>Private, staff-only export for the students you are authorized to view. Up to 30 learners per file, ready for school reporting.</p>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <label htmlFor="export-period">Period</label>
      <select id="export-period" value={period} disabled={busy} onChange={event => {
        setPeriod(event.target.value as Period); setCursor(null); setNextCursor(null); setPage(1); setDownloaded(false)
      }}>
        <option value="daily">Today</option><option value="weekly">Last 7 days</option><option value="monthly">Last 30 days</option>
      </select>
      <button type="button" disabled={busy} onClick={() => void download()} style={{ padding: '10px 15px', borderRadius: 9, background: '#7657d7', color: 'white' }}>
        {busy ? 'Preparing…' : `Download page ${page}`}
      </button>
      {downloaded && nextCursor ? <button type="button" disabled={busy} onClick={() => {
        setCursor(nextCursor); setNextCursor(null); setPage(current => current + 1); setDownloaded(false)
      }}>Next 30 students →</button> : null}
    </div>
    {error && <p role="alert" style={{ color: '#a33226' }}>{error}</p>}
    <small>Contains personal student information. Share only through school-approved secure channels.</small>
  </section>
}
