'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDownToLine,
  BookOpen,
  Check,
  Info,
  Layers3,
  LockKeyhole,
  Map,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react'
import { SchoolShell } from '@/components/school/school-shell'
import { useAuth } from '@/components/auth/auth-provider'
import { curriculumService } from '@/services/curriculum-service'
import {
  gradeLevelMapService,
  type EditorMappedLevel,
  type GradeLevelMap,
} from '@/services/grade-level-map'
import { loadGradePlans } from './plan-loaders'
import {
  buildExplorerPlan,
  gradeName,
  isEducator,
  isValidLiveMap,
  matchesPlan,
  parseReviews,
  reviewKey,
  validGrade,
  validLevel,
  type ExplorerFilters,
  type ExplorerPlan,
  type ExplorerView,
  type PlanReview,
  type PlanReviews,
} from './model'
import { LevelMap } from './LevelMap'
import { LevelDetail } from './LevelDetail'
import { CoverageView } from './CoverageView'
import { TeachingPreview } from './TeachingPreview'
import styles from './explorer.module.css'

export interface ExplorerProps {
  initialGrade?: number | 'all'
  initialLevel?: number
  initialView?: ExplorerView
  initialUnit?: string
  initialSearch?: string
  initialSample?: string
  initialAddress?: string
  classId?: string
}
const views: { id: ExplorerView; title: string; icon: typeof Map }[] = [
  { id: 'map', title: 'Level map', icon: Map },
  { id: 'coverage', title: 'Lesson coverage', icon: BookOpen },
  { id: 'teaching', title: 'Teaching preview', icon: Play },
]

/** Only renders inside authenticated teacher/school routes; no student runtime is mounted. */
export function CurriculumExplorerPage(props: ExplorerProps) {
  const { status, role, session } = useAuth()
  const [resolved, setResolved] = useState<{
    id: string
    grade: number
  } | null>(null)
  const [classError, setClassError] = useState('')
  const [retry, setRetry] = useState(0)
  const allowed = status === 'authenticated' && isEducator(role)
  const scope = `${session?.school?.id ?? ''}:${session?.user?.id ?? ''}:${role ?? ''}`
  useEffect(() => {
    if (!props.classId || !allowed) return
    let active = true
    setResolved(null)
    setClassError('')
    curriculumService
      .getClass(props.classId)
      .then((data) => {
        if (active) {
          if (
            !Number.isInteger(data.grade) ||
            data.grade < 0 ||
            data.grade > 10
          )
            throw new Error('The class has an invalid curriculum grade.')
          setResolved({ id: props.classId!, grade: data.grade })
        }
      })
      .catch((error: unknown) => {
        if (active)
          setClassError(
            error instanceof Error
              ? error.message
              : 'Could not resolve this school class.'
          )
      })
    return () => {
      active = false
    }
  }, [props.classId, allowed, scope, retry])
  if (!allowed) return <div role="status">Opening educator curriculum…</div>
  if (props.classId && resolved?.id !== props.classId)
    return (
      <SchoolShell
        title="Curriculum explorer"
        subtitle="Teacher & school planning workspace"
      >
        <div className={styles.notice} role={classError ? 'alert' : 'status'}>
          <p>
            {classError ||
              'Resolving the class from your authorized school curriculum…'}
          </p>
          {classError ? (
            <button
              className={styles.textButton}
              type="button"
              onClick={() => setRetry((v) => v + 1)}
            >
              Retry
            </button>
          ) : null}
        </div>
      </SchoolShell>
    )
  return (
    <CurriculumExplorer
      key={`${props.classId ?? ''}:${resolved?.grade ?? props.initialGrade}:${props.initialLevel}:${props.initialView}:${scope}`}
      {...props}
      initialGrade={resolved?.grade ?? props.initialGrade}
    />
  )
}

function CurriculumExplorer({
  initialGrade = 1,
  initialLevel = 1,
  initialView = 'map',
  initialUnit = 'all',
  initialSearch = '',
  initialSample,
  initialAddress,
}: ExplorerProps) {
  const { session } = useAuth()
  const [filters, setFilters] = useState<ExplorerFilters>({
    grade: initialGrade === 'all' ? 'all' : validGrade(initialGrade),
    unit: ['1', '2', '3', '4'].includes(initialUnit) ? initialUnit : 'all',
    search: initialSearch.slice(0, 120),
  })
  const [view, setView] = useState<ExplorerView>(initialView)
  const [selectedId, setSelectedId] = useState(
    initialGrade === 'all' &&
      initialAddress &&
      /^g(?:0\d|10)-l(?:0[1-9]|10)$/.test(initialAddress)
      ? initialAddress
      : `g${String(initialGrade === 'all' ? 1 : validGrade(initialGrade)).padStart(2, '0')}-l${String(validLevel(initialLevel)).padStart(2, '0')}`
  )
  const [sampleId, setSampleId] = useState(initialSample)
  const [catalog, setCatalog] = useState<{
    key: string
    plans: ExplorerPlan[]
    error: string
  }>({ key: '', plans: [], error: '' })
  const [reload, setReload] = useState(0)
  const [liveReload, setLiveReload] = useState(0)
  const [live, setLive] = useState<{
    key: string
    data?: GradeLevelMap
    error?: string
  }>({ key: '' })
  const [detail, setDetail] = useState<{
    key: string
    data?: EditorMappedLevel
  }>({ key: '' })
  const [reviewState, setReviewState] = useState<{
    key: string | null
    data: PlanReviews
  }>({ key: null, data: {} })
  const [storageNotice, setStorageNotice] = useState('')
  const sourceDialog = useRef<HTMLDialogElement>(null)
  const detailRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const scope = `${session?.school?.id ?? ''}:${session?.user?.id ?? ''}:${session?.role ?? ''}`
  const storageKey = reviewKey(session?.school?.id, session?.user?.id)
  const reviews = reviewState.key === storageKey ? reviewState.data : {}
  const catalogKey = `${filters.grade}:${reload}`

  useEffect(() => {
    let active = true
    const grades =
      filters.grade === 'all'
        ? Array.from({ length: 11 }, (_, i) => i)
        : [filters.grade]
    Promise.all(grades.map(loadGradePlans))
      .then((groups) => {
        if (active)
          setCatalog({
            key: catalogKey,
            plans: groups.flat().map(buildExplorerPlan),
            error: '',
          })
      })
      .catch((error: unknown) => {
        if (active)
          setCatalog({
            key: catalogKey,
            plans: [],
            error:
              error instanceof Error
                ? error.message
                : 'Could not load the authoring catalog.',
          })
      })
    return () => {
      active = false
    }
  }, [filters.grade, catalogKey])

  useEffect(() => {
    try {
      setReviewState({
        key: storageKey,
        data: storageKey ? parseReviews(localStorage.getItem(storageKey)) : {},
      })
    } catch {
      setReviewState({ key: storageKey, data: {} })
      setStorageNotice(
        'Browser storage is unavailable. Reviews will last only for this visit.'
      )
    }
  }, [storageKey])

  const loading = catalog.key !== catalogKey
  const plans = loading ? [] : catalog.plans
  const visible = useMemo(
    () => plans.filter((p) => matchesPlan(p, filters)),
    [plans, filters]
  )
  const selected = visible.find((p) => p.config.id === selectedId) ?? visible[0]
  const selectedGrade = selected?.config.grade
  const liveKey = `${scope}:${selectedGrade}:${liveReload}`
  const detailKey = `${scope}:${selected?.config.id}:${liveReload}`

  useEffect(() => {
    if (selectedGrade === undefined) return
    let active = true
    gradeLevelMapService
      .grade(selectedGrade)
      .then((data) => {
        if (!isValidLiveMap(data, selectedGrade))
          throw new Error(
            'The school curriculum response does not match the selected class.'
          )
        if (active) setLive({ key: liveKey, data })
      })
      .catch((error: unknown) => {
        if (active)
          setLive({
            key: liveKey,
            error:
              error instanceof Error
                ? error.message
                : 'School availability could not be verified.',
          })
      })
    return () => {
      active = false
    }
  }, [selectedGrade, scope, liveKey])

  useEffect(() => {
    if (!selected) return
    let active = true
    const { grade, level, id } = selected.config
    gradeLevelMapService
      .level(grade, level)
      .then((data) => {
        if (data.address !== id || data.grade !== grade || data.level !== level)
          throw new Error('Level response mismatch')
        if (active) setDetail({ key: detailKey, data })
      })
      .catch(() => {
        if (active) setDetail({ key: detailKey })
      })
    return () => {
      active = false
    }
  }, [selected?.config.id, detailKey])

  const actual = detail.key === detailKey ? detail.data : undefined
  const liveData = live.key === liveKey ? live.data : undefined
  const liveError = live.key === liveKey ? live.error : undefined
  const chapters = visible
    .flatMap((p) => p.chapters)
    .filter((c) => filters.unit === 'all' || String(c.unit) === filters.unit)
  const audited = chapters.reduce((n, c) => n + c.tasks.length, 0)

  function writeLocation(
    next: ExplorerFilters,
    nextView: ExplorerView,
    id = selected?.config.id ?? selectedId,
    sample = sampleId
  ) {
    const q = new URLSearchParams({
      grade: String(next.grade),
      level: String(Number(id.slice(-2))),
      view: nextView,
    })
    if (next.grade === 'all') q.set('address', id)
    if (next.unit !== 'all') q.set('unit', next.unit)
    if (next.search.trim()) q.set('q', next.search.trim())
    if (sample) q.set('sample', sample)
    window.history.replaceState(
      null,
      '',
      `/school/curriculum-map?${q.toString()}`
    )
  }
  function updateFilters(changes: Partial<ExplorerFilters>) {
    const next = { ...filters, ...changes }
    if (
      changes.grade !== undefined &&
      changes.grade !== 'all' &&
      changes.grade !== 1
    )
      next.unit = 'all'
    if (changes.grade !== undefined) {
      setSelectedId(
        `g${String(changes.grade === 'all' ? 1 : changes.grade).padStart(2, '0')}-l01`
      )
      setSampleId(undefined)
    }
    setFilters(next)
    writeLocation(
      next,
      view,
      changes.grade !== undefined
        ? `g${String(changes.grade === 'all' ? 1 : changes.grade).padStart(2, '0')}-l01`
        : undefined,
      changes.grade !== undefined ? undefined : sampleId
    )
  }
  function showView(next: ExplorerView) {
    setView(next)
    writeLocation(filters, next)
  }
  function select(id: string) {
    setSelectedId(id)
    setSampleId(undefined)
    writeLocation(filters, view, id, undefined)
    if (window.matchMedia('(max-width: 800px)').matches)
      detailRef.current?.scrollIntoView({ block: 'start' })
  }
  function preview(id: string, sample?: string) {
    setSelectedId(id)
    setSampleId(sample)
    setView('teaching')
    const next = { ...filters, unit: 'all', search: '' }
    if (filters.grade !== 'all') next.grade = Number(id.slice(1, 3))
    setFilters(next)
    writeLocation(next, 'teaching', id, sample)
    tabsRef.current?.scrollIntoView({ block: 'start' })
  }
  function saveReview(id: string, value: PlanReview) {
    const next = { ...reviews, [id]: value }
    setReviewState({ key: storageKey, data: next })
    try {
      if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next))
      else
        setStorageNotice(
          'School/account identity is unavailable. Reviews will last only for this visit.'
        )
    } catch {
      setStorageNotice(
        'Browser storage is unavailable. Reviews will last only for this visit.'
      )
    }
  }
  function exportReview() {
    const payload = {
      format: 'talkora-staff-curriculum-review-v1',
      publicationApproved: false,
      studentProgressChanged: false,
      filters,
      levels: visible.map((p) => ({
        address: p.config.id,
        title: p.config.title,
        chapters: p.chapters.map((c) => c.code),
        review: reviews[p.config.id] ?? { decision: 'pending', note: '' },
      })),
    }
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    )
    const a = document.createElement('a')
    a.href = url
    a.download = 'talkora-curriculum-review.json'
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <SchoolShell
      title="Curriculum explorer"
      subtitle="One shared planning space, from Kindergarten to Class 10."
      workspaceClassName="curriculum-explorer-workspace"
    >
      <div className={styles.root}>
        <header className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>
              <span />
              THE LEARNING JOURNEY
            </span>
            <h2>
              {filters.grade === 'all'
                ? 'A bigger picture. Every little step.'
                : `${gradeName(filters.grade)}, carefully mapped.`}
            </h2>
            <p>
              Inspect progression, protect the syllabus, and rehearse a teaching
              turn.
            </p>
          </div>
          <span className={styles.privateBadge}>
            <LockKeyhole size={13} />
            Teacher & school only
          </span>
        </header>
        <section className={styles.filters} aria-label="Curriculum filters">
          <label>
            School
            <select
              aria-label="Authorized school"
              value={session?.school?.id ?? 'current'}
              disabled
            >
              <option value={session?.school?.id ?? 'current'}>
                {session?.school?.name ?? 'Current school account'}
              </option>
            </select>
            <small>Records stay within your authorized school.</small>
          </label>
          <label>
            Class
            <select
              aria-label="Choose a class"
              value={filters.grade}
              onChange={(e) =>
                updateFilters({
                  grade:
                    e.target.value === 'all' ? 'all' : Number(e.target.value),
                })
              }
            >
              <option value="all">All classes · KG–10</option>
              {Array.from({ length: 11 }, (_, grade) => (
                <option key={grade} value={grade}>
                  {gradeName(grade)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Textbook unit
            <select
              aria-label="Filter textbook unit"
              value={filters.unit}
              disabled={filters.grade !== 1 && filters.grade !== 'all'}
              onChange={(e) => updateFilters({ unit: e.target.value })}
            >
              <option value="all">All assigned chapters</option>
              {[1, 2, 3, 4].map((unit) => (
                <option key={unit} value={unit}>
                  Class 1 · Unit {unit}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.searchFilter}>
            Search
            <div>
              <Search size={15} />
              <input
                aria-label="Search curriculum"
                type="search"
                maxLength={120}
                placeholder="Lesson, chapter, activity…"
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
              />
            </div>
          </label>
        </section>
        <section className={styles.summary} aria-label="Plan coverage summary">
          <div className={styles.summaryIdentity}>
            <BookOpen size={25} />
            <div>
              <b>
                {filters.grade === 'all'
                  ? 'KG–Class 10 authoring catalog'
                  : `${gradeName(filters.grade)} curriculum plan`}
              </b>
              <small>Existing assignments · read-only inspection</small>
            </div>
          </div>
          <div>
            <b>{visible.length}</b>
            <small>levels shown</small>
          </div>
          <div>
            <b>{chapters.length}</b>
            <small>linked chapters</small>
          </div>
          <div>
            <b>{visible.reduce((n, p) => n + p.activities.length, 0)}</b>
            <small>authored activities</small>
          </div>
          <span className={styles.statusBadge}>Educator review required</span>
        </section>
        <div className={styles.tabsBar} ref={tabsRef}>
          <div
            role="tablist"
            aria-label="Curriculum explorer views"
            className={styles.tabs}
            onKeyDown={(e) => {
              if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key))
                return
              e.preventDefault()
              const i = views.findIndex((v) => v.id === view)
              const index =
                e.key === 'Home'
                  ? 0
                  : e.key === 'End'
                    ? 2
                    : (i + (e.key === 'ArrowRight' ? 1 : 2)) % 3
              showView(views[index].id)
              document
                .getElementById(`explorer-tab-${views[index].id}`)
                ?.focus()
            }}
          >
            {views.map(({ id, title, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`explorer-tab-${id}`}
                aria-controls={`explorer-panel-${id}`}
                aria-selected={view === id}
                tabIndex={view === id ? 0 : -1}
                onClick={() => showView(id)}
              >
                <Icon size={16} />
                {title}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={styles.textButton}
            onClick={() => sourceDialog.current?.showModal()}
          >
            <Info size={13} />
            Sources & scope
          </button>
        </div>
        {storageNotice ? (
          <p className={styles.warning} role="status">
            {storageNotice}
          </p>
        ) : null}
        {loading ? (
          <div className={styles.loading} aria-busy="true" role="status">
            <Layers3 size={24} />
            <p>Opening the curriculum catalog…</p>
          </div>
        ) : catalog.error ? (
          <div className={styles.notice} role="alert">
            <p>{catalog.error}</p>
            <button
              type="button"
              className={styles.textButton}
              onClick={() => setReload((v) => v + 1)}
            >
              Retry catalog
            </button>
          </div>
        ) : null}
        {!loading && !catalog.error && !visible.length ? (
          <div className={styles.empty}>
            <Search size={28} />
            <h3>No matching levels</h3>
            <p>Try another chapter or clear the unit and search filters.</p>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => updateFilters({ unit: 'all', search: '' })}
            >
              Clear filters
            </button>
          </div>
        ) : null}
        {selected ? (
          <>
            <div className={styles.liveStrip}>
              <ShieldCheck size={15} />
              <span>
                {liveError
                  ? 'Live school records unavailable. Authoring plans remain readable.'
                  : !liveData
                    ? 'Verifying live school availability…'
                    : `Live ${gradeName(selected.config.grade)}: ${liveData.mappedCount}/10 mapped · ${liveData.publishedCount}/10 with active lesson activities.`}
              </span>
              <button
                type="button"
                className={styles.textButton}
                onClick={() => setLiveReload((v) => v + 1)}
              >
                <RotateCcw size={12} />
                {liveError ? 'Retry' : 'Refresh'}
              </button>
            </div>
            {liveError ? (
              <details className={styles.liveError}>
                <summary>Why live availability is unavailable</summary>
                <p>{liveError}</p>
                <p>
                  Role restrictions and backend authorization remain enforced.
                  Catalog drafts do not imply student access.
                </p>
              </details>
            ) : null}
            <section
              role="tabpanel"
              id="explorer-panel-map"
              aria-labelledby="explorer-tab-map"
              hidden={view !== 'map'}
            >
              <div className={styles.mapLayout}>
                <div ref={mapRef}>
                  <LevelMap
                    plans={visible}
                    selected={selected.config.id}
                    reviews={reviews}
                    onSelect={select}
                  />
                  <div className={styles.principle}>
                    <Layers3 size={20} />
                    <div>
                      <b>Same curriculum. Space to learn at their pace.</b>
                      <p>
                        Class 1 keeps all 44 chapter assignments across the
                        existing ten levels. A level may span multiple sessions.
                        Other grades show their existing catalog, including
                        gaps.
                      </p>
                    </div>
                  </div>
                </div>
                <div ref={detailRef}>
                  <LevelDetail
                    plan={selected}
                    actual={actual}
                    reviews={reviews}
                    onReview={saveReview}
                    onView={showView}
                    onBack={() =>
                      mapRef.current?.scrollIntoView({ block: 'start' })
                    }
                  />
                </div>
              </div>
            </section>
            <section
              role="tabpanel"
              id="explorer-panel-coverage"
              aria-labelledby="explorer-tab-coverage"
              hidden={view !== 'coverage'}
            >
              {view === 'coverage' ? (
                <CoverageView
                  plans={visible}
                  unit={filters.unit}
                  search={filters.search}
                  records={liveData?.levels}
                  onPreview={preview}
                />
              ) : null}
              {chapters.length ? (
                <p className={styles.coverageSummary}>
                  {audited} numbered activities audited in the visible Unit One
                  chapters. {chapters.filter((c) => !c.tasks.length).length}{' '}
                  linked chapters still require their full exercise audit.
                </p>
              ) : null}
            </section>
            <section
              role="tabpanel"
              id="explorer-panel-teaching"
              aria-labelledby="explorer-tab-teaching"
              hidden={view !== 'teaching'}
            >
              <div className={styles.teachingLevelPicker}>
                <label>
                  Inspect a level
                  <select
                    aria-label="Teaching level"
                    value={selected.config.id}
                    onChange={(e) => {
                      setSelectedId(e.target.value)
                      setSampleId(undefined)
                      writeLocation(filters, view, e.target.value, undefined)
                    }}
                  >
                    {visible.map((p) => (
                      <option key={p.config.id} value={p.config.id}>
                        {gradeName(p.config.grade)} · {p.config.level} ·{' '}
                        {p.config.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {view === 'teaching' ? (
                <TeachingPreview
                  key={`${selected.config.id}:${sampleId ?? ''}`}
                  plan={selected}
                  initialSample={sampleId}
                  onNext={preview}
                />
              ) : null}
              <div className={styles.reviewAfterPreview}>
                <button
                  type="button"
                  className={styles.textButton}
                  onClick={() => showView('map')}
                >
                  Return to level details & planning review
                </button>
              </div>
            </section>
          </>
        ) : null}
        <footer className={styles.footer}>
          <span>
            <ShieldCheck size={13} />
            Read-only curriculum planning
          </span>
          <span>
            {
              Object.values(reviews).filter((r) => r.decision === 'reviewed')
                .length
            }{' '}
            / 110 plans reviewed locally
          </span>
          <button
            type="button"
            className={styles.textButton}
            disabled={!visible.length}
            onClick={exportReview}
          >
            <ArrowDownToLine size={13} />
            Export visible plan review
          </button>
        </footer>
        <dialog
          className={styles.sourceDialog}
          ref={sourceDialog}
          aria-labelledby="explorer-sources-title"
        >
          <header>
            <div>
              <span className={styles.eyebrow}>THE BASIS OF THIS EXPLORER</span>
              <h2 id="explorer-sources-title">Sources, scope & review</h2>
            </div>
            <button
              type="button"
              aria-label="Close sources"
              onClick={() => sourceDialog.current?.close()}
            >
              <X size={20} />
            </button>
          </header>
          <div>
            <h3>Existing curriculum remains authoritative</h3>
            <p>
              All 110 level definitions, activities and existing Class 1 chapter
              assignments are read without editing them. Live availability is
              fetched through your existing authenticated school APIs. Counts
              for local plans are separate from published lesson records.
            </p>
            <h3>Class 1 textbook coverage</h3>
            <p>
              English Balbharati, Grade One, first edition 2025 / reprint 2026.
              The existing draft assigns 44 chapters across ten levels. Unit
              One’s 35 numbered activities on printed pages 1–17 have a separate
              read-only coverage audit. Full exercise audits for Units Two–Four
              are pending.
            </p>
            <a
              href="https://ebooks.ebalbharati.in/pdfs/103050001.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open official Balbharati textbook ↗
            </a>
            <h3>KG and Classes 2–10</h3>
            <p>
              Use the current level objectives, authored activities and
              editorial ideas. Where a textbook is not linked, this screen
              explicitly reports missing chapter coverage. A planned level is
              not a verified syllabus or a playable student lesson.
            </p>
            <h3>Preview and school boundaries</h3>
            <p>
              The teaching flow is scripted and staff-controlled. It records no
              real attempts, scores, XP, unlocks, publication decisions, or
              microphone audio. The school context comes from your signed-in
              account; other schools’ records are not exposed.
            </p>
            <h3>Review notes</h3>
            <p>
              Notes are isolated by school and staff account in this browser.
              Export them for review; they do not update curriculum or student
              records. “Plan reviewed” is not permission to publish.
            </p>
          </div>
          <footer>
            <span>
              <Check size={13} />
              Content-first inspection
            </span>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => sourceDialog.current?.close()}
            >
              Back to exploring
            </button>
          </footer>
        </dialog>
      </div>
    </SchoolShell>
  )
}
