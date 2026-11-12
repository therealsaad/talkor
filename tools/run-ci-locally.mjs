#!/usr/bin/env node
/**
 * Runs the same checks GitHub CI runs, on your own computer, before you push.
 *
 * It reads .github/workflows/talkora-110-level-checks.yml, so it can never drift from CI: when someone adds a check
 * to the workflow, this runs it too. It only RUNS the checks. It does not deploy, publish, seed, migrate or call
 * any paid provider; it runs exactly the `run:` commands the workflow already runs on GitHub's machines.
 *
 *   node tools/run-ci-locally.mjs                 every job (structure, frontend, backend)
 *   node tools/run-ci-locally.mjs --changed       only the jobs your changes can affect (vs origin/main)
 *   node tools/run-ci-locally.mjs --job backend   one job
 *   node tools/run-ci-locally.mjs --list          show the steps without running anything
 *   node tools/run-ci-locally.mjs --only billi    only steps whose name or command contains that text
 *   node tools/run-ci-locally.mjs --keep-going    do not stop at the first failure
 *   node tools/run-ci-locally.mjs --install       also run the `pnpm install --frozen-lockfile` steps
 *
 * Steps that cannot run on this computer (no MongoDB on 127.0.0.1:27017, no Chrome at the CI path, no bash) are
 * SKIPPED and listed, never silently passed. A skipped step means "CI will still check it", so read the summary.
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const DEFAULT_WORKFLOW = '.github/workflows/talkora-110-level-checks.yml'

const indentOf = (line) => line.length - line.trimStart().length
const unquote = (value) => {
  const v = value.trim()
  return (v.length > 1 && ((v[0] === '"' && v.at(-1) === '"') || (v[0] === "'" && v.at(-1) === "'"))) ? v.slice(1, -1) : v
}

/**
 * Reads the jobs and steps of a workflow file. This is deliberately a small reader for the shapes this workflow
 * uses (plain scalars, `|` and `>-` blocks, one-level `env:` maps), not a general YAML parser; the tests parse the
 * real workflow and compare the count with the file, so an unsupported shape fails loudly instead of losing a step.
 */
export function parseWorkflow(text) {
  const lines = text.split(/\r?\n/)
  const jobs = []
  let inJobs = false
  let job = null
  let inSteps = false
  let step = null
  const finishStep = () => { if (step && job) job.steps.push(step); step = null }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim() || line.trimStart().startsWith('#')) continue
    const indent = indentOf(line)
    if (indent === 0) { finishStep(); inJobs = /^jobs:\s*$/.test(line); job = null; inSteps = false; continue }
    if (!inJobs) continue
    if (indent === 2 && /^\s{2}[\w-]+:\s*$/.test(line)) { finishStep(); job = { id: line.trim().slice(0, -1), steps: [], services: false }; jobs.push(job); inSteps = false; continue }
    if (!job) continue
    if (indent === 4) {
      finishStep()
      inSteps = /^\s{4}steps:\s*$/.test(line)
      if (/^\s{4}services:\s*$/.test(line)) job.services = true
      continue
    }
    if (!inSteps) continue

    const isStepStart = indent === 6 && line.trimStart().startsWith('- ')
    if (isStepStart) { finishStep(); step = { name: '', run: '', workingDirectory: '', env: {}, shell: '', uses: '', line: i + 1 } }
    if (!step) continue
    const body = isStepStart ? line.trimStart().slice(2) : line.trim()
    const keyIndent = isStepStart ? 8 : indent
    const match = /^([\w-]+):\s*(.*)$/.exec(body)
    if (!match || (keyIndent !== 8 && !isStepStart)) continue
    const [, key, rest] = match
    const readBlock = () => {
      const block = []
      let j = i + 1
      while (j < lines.length && (!lines[j].trim() || indentOf(lines[j]) > 8)) { block.push(lines[j]); j++ }
      const content = block.filter((l, k) => l.trim() || k < block.length - 1)
      const strip = Math.min(...content.filter((l) => l.trim()).map(indentOf), Infinity)
      i = j - 1
      return content.map((l) => l.slice(Number.isFinite(strip) ? strip : 0))
    }
    if (key === 'name') step.name = unquote(rest)
    else if (key === 'uses') step.uses = unquote(rest)
    else if (key === 'working-directory') step.workingDirectory = unquote(rest)
    else if (key === 'shell') step.shell = unquote(rest)
    else if (key === 'run') {
      if (/^[|>][+-]?$/.test(rest.trim())) {
        const block = readBlock()
        step.run = rest.trim().startsWith('>') ? block.join(' ').trim() : block.join('\n').replace(/\s+$/, '')
      } else step.run = unquote(rest)
    } else if (key === 'env' && !rest.trim()) {
      let j = i + 1
      while (j < lines.length && (!lines[j].trim() || indentOf(lines[j]) > 8)) {
        const pair = /^\s+([\w-]+):\s*(.*)$/.exec(lines[j])
        if (pair) step.env[pair[1]] = unquote(pair[2])
        j++
      }
      i = j - 1
    } else if (key === 'with') {
      readBlock()
    }
  }
  finishStep()
  return jobs.map((j) => ({ ...j, steps: j.steps.map((s, k) => ({ ...s, job: j.id, index: k + 1 })) }))
}

/** Which jobs can a set of changed files affect? Anything unknown runs everything, so nothing is missed. */
export function jobsForChangedFiles(files) {
  const jobs = new Set()
  for (const file of files.map((f) => f.replace(/\\/g, '/'))) {
    if (file.startsWith('client/')) jobs.add('frontend')
    else if (file.startsWith('backend/')) jobs.add('backend')
    else if (file.startsWith('tools/') || file.startsWith('docs/') || /^README\.md$/i.test(file)) jobs.add('structure')
    else return ['structure', 'frontend', 'backend']
  }
  // The workflow itself and tools/ change what every job runs.
  if (files.some((f) => f.replace(/\\/g, '/').startsWith('.github/'))) return ['structure', 'frontend', 'backend']
  return ['structure', 'frontend', 'backend'].filter((j) => jobs.has(j))
}

const isInstall = (step) => /^pnpm install\b/.test(step.run.trim())

/**
 * Decides, for every step, whether to run or skip it here and why. `facts` says what this computer has
 * (mongo, bash, existing paths) so the decision is testable without touching the machine.
 */
export function planSteps(jobs, options, facts) {
  const wanted = options.jobs?.length ? new Set(options.jobs) : null
  const plan = []
  for (const job of jobs) {
    if (wanted && !wanted.has(job.id)) continue
    for (const step of job.steps) {
      if (!step.run) continue // checkout, setup-node and similar GitHub-only steps
      const label = step.name || step.run.split('\n')[0]
      const entry = { job: job.id, index: step.index, name: label, step, action: 'run', reason: '' }
      const haystack = (label + '\n' + step.run).toLowerCase()
      if (options.only && !haystack.includes(options.only.toLowerCase())) continue
      if (isInstall(step) && !options.install) { entry.action = 'skip'; entry.reason = 'install step (add --install to run it)' }
      else if (step.shell === 'bash' && !facts.bash) { entry.action = 'skip'; entry.reason = 'needs bash (install Git for Windows or use WSL)' }
      else if (step.env.CHROME_PATH && !facts.pathExists(step.env.CHROME_PATH)) { entry.action = 'skip'; entry.reason = `needs Chrome at ${step.env.CHROME_PATH} (set CHROME_PATH to run it)` }
      else if (/127\.0\.0\.1:27017|localhost:27017/.test(JSON.stringify(step.env) + step.run) && !facts.mongo) { entry.action = 'skip'; entry.reason = 'needs MongoDB on 127.0.0.1:27017' }
      plan.push(entry)
    }
  }
  return plan
}

function probePort(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host })
    const done = (value) => { socket.destroy(); resolve(value) }
    socket.setTimeout(800, () => done(false))
    socket.once('connect', () => done(true))
    socket.once('error', () => done(false))
  })
}

function hasBash() {
  const result = spawnSync('bash', ['-c', 'echo ok'], { encoding: 'utf8' })
  return result.status === 0 && result.stdout.trim() === 'ok'
}

function runStep(entry, extraEnv) {
  const cwd = path.join(root, entry.step.workingDirectory || '.')
  const env = { ...process.env, ...entry.step.env, ...extraEnv }
  const started = Date.now()
  return new Promise((resolve) => {
    const child = entry.step.shell === 'bash'
      ? spawn('bash', ['-e', '-c', entry.step.run], { cwd, env })
      : spawn(entry.step.run, { cwd, env, shell: true })
    let output = ''
    const keep = (chunk) => { output += chunk; if (output.length > 200_000) output = output.slice(-100_000) }
    child.stdout.on('data', keep)
    child.stderr.on('data', keep)
    child.on('error', (error) => resolve({ ok: false, output: output + String(error), ms: Date.now() - started }))
    child.on('close', (code) => resolve({ ok: code === 0, output, ms: Date.now() - started }))
  })
}

function parseArgs(argv) {
  const options = { jobs: [], keepGoing: false, install: false, list: false, changed: false, only: '', workflow: DEFAULT_WORKFLOW }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const value = () => argv[++i]
    if (arg === '--job') options.jobs.push(value())
    else if (arg === '--only') options.only = value() || ''
    else if (arg === '--workflow') options.workflow = value()
    else if (arg === '--keep-going') options.keepGoing = true
    else if (arg === '--install') options.install = true
    else if (arg === '--list') options.list = true
    else if (arg === '--changed') options.changed = true
    else if (arg === '--help' || arg === '-h') options.help = true
    else throw new Error(`Unknown option ${arg}. Use --help.`)
  }
  return options
}

function changedFiles() {
  const base = spawnSync('git', ['merge-base', 'HEAD', 'origin/main'], { cwd: root, encoding: 'utf8' })
  const from = base.status === 0 ? base.stdout.trim() : 'origin/main'
  const diff = spawnSync('git', ['diff', '--name-only', from], { cwd: root, encoding: 'utf8' })
  const untracked = spawnSync('git', ['ls-files', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' })
  if (diff.status !== 0) return null
  return [...diff.stdout.split('\n'), ...untracked.stdout.split('\n')].map((s) => s.trim()).filter(Boolean)
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) { console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0].replace(/^\/\*\*|^ \* ?/gm, '').replace(/^#!.*\n/, '')); return 0 }
  const workflowPath = path.resolve(root, options.workflow)
  const jobs = parseWorkflow(readFileSync(workflowPath, 'utf8'))
  if (options.changed) {
    const files = changedFiles()
    options.jobs = files ? jobsForChangedFiles(files) : []
    console.log(files ? `Changed files: ${files.length}. Jobs to run: ${options.jobs.join(', ') || 'none'}` : 'Could not compare with origin/main (run `git fetch origin`); running every job.')
    if (files && !options.jobs.length) { console.log('Nothing to check.'); return 0 }
  }
  const facts = {
    bash: hasBash(),
    mongo: await probePort(27017),
    pathExists: (p) => existsSync(p),
  }
  const plan = planSteps(jobs, options, facts)
  const runnable = plan.filter((p) => p.action === 'run')
  console.log(`${path.basename(options.workflow)}: ${runnable.length} step(s) to run, ${plan.length - runnable.length} skipped on this computer.\n`)

  if (options.list) {
    for (const p of plan) console.log(`${p.action === 'run' ? ' run ' : 'skip '} ${p.job} #${p.index}  ${p.name}${p.reason ? `   [${p.reason}]` : ''}`)
    return 0
  }

  let passed = 0
  const failed = []
  const skipped = plan.filter((p) => p.action === 'skip')
  let position = 0
  for (const entry of plan) {
    if (entry.action !== 'run') continue
    position += 1
    process.stdout.write(`[${position}/${runnable.length}] ${entry.job}: ${entry.name} ... `)
    const result = await runStep(entry, {})
    if (result.ok) { passed += 1; console.log(`ok (${(result.ms / 1000).toFixed(1)}s)`); continue }
    failed.push(entry)
    console.log(`FAILED (${(result.ms / 1000).toFixed(1)}s)\n`)
    console.log(`--- ${entry.job} #${entry.index}: ${entry.step.run.split('\n')[0]} (in ${entry.step.workingDirectory || '.'}) ---`)
    console.log(result.output.split('\n').slice(-60).join('\n'))
    console.log('---\n')
    if (!options.keepGoing) break
  }

  console.log('\nSummary')
  console.log(`  passed: ${passed}   failed: ${failed.length}   skipped here: ${skipped.length}`)
  for (const p of failed) console.log(`  FAILED  ${p.job} #${p.index}  ${p.name}`)
  if (skipped.length) {
    console.log('  Skipped steps are still checked by CI:')
    for (const p of skipped) console.log(`    ${p.job} #${p.index}  ${p.name}  [${p.reason}]`)
  }
  if (failed.length) console.log('\nCI would be RED. Fix the failed step(s) before you push.')
  else if (!runnable.length) console.log('\nNo step ran. Check --job / --only.')
  else console.log(skipped.length ? '\nEverything that could run here passed. CI also runs the skipped steps.' : '\nCI would be GREEN for these jobs.')
  return failed.length ? 1 : 0
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then((code) => { process.exitCode = code }, (error) => { console.error(error.message); process.exitCode = 2 })
}
