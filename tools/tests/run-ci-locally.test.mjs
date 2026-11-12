import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { DEFAULT_WORKFLOW, jobsForChangedFiles, parseWorkflow, planSteps } from '../run-ci-locally.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const runner = path.join(root, 'tools', 'run-ci-locally.mjs')
const here = { bash: true, mongo: true, pathExists: () => true }

const SAMPLE = `name: Sample
on:
  push:
    branches: [main]
jobs:
  alpha:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      # a comment between steps
      - name: Plain step
        run: node --test tests/a.test.mjs
        working-directory: client
      - run: pnpm install --frozen-lockfile
        working-directory: client
      - name: Block step
        shell: bash
        run: |
          set -e
          echo one
            echo indented
          echo two
        working-directory: client
      - name: Folded step
        run: >-
          node
          --version
  beta:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:7.0
        options: >-
          --health-cmd "mongosh"
    steps:
      - name: Needs mongo
        run: pnpm exec jest tests/x.test.ts
        working-directory: backend
        env:
          TALKORA_TEST_MONGO_URI: mongodb://127.0.0.1:27017
          OTHER: 'quoted value'
      - name: Needs chrome
        run: node --test tests/browser.test.mjs
        env:
          CHROME_PATH: /usr/bin/google-chrome
`

test('it reads jobs, steps, blocks, env and working directories from a workflow', () => {
  const jobs = parseWorkflow(SAMPLE)
  assert.deepEqual(jobs.map((j) => [j.id, j.steps.length]), [['alpha', 6], ['beta', 2]])
  const [, , plain, install, block, folded] = jobs[0].steps
  assert.equal(plain.name, 'Plain step')
  assert.equal(plain.run, 'node --test tests/a.test.mjs')
  assert.equal(plain.workingDirectory, 'client')
  assert.equal(install.run, 'pnpm install --frozen-lockfile')
  assert.equal(block.shell, 'bash')
  assert.equal(block.run, 'set -e\necho one\n  echo indented\necho two')
  assert.equal(folded.run, 'node --version')
  assert.equal(jobs[1].services, true)
  assert.deepEqual({ ...jobs[1].steps[0].env }, { TALKORA_TEST_MONGO_URI: 'mongodb://127.0.0.1:27017', OTHER: 'quoted value' })
})

test('the real workflow is read completely: no step is lost or merged', () => {
  const text = readFileSync(path.join(root, DEFAULT_WORKFLOW), 'utf8')
  const jobs = parseWorkflow(text)
  assert.deepEqual(jobs.map((j) => j.id), ['structure', 'frontend', 'backend'])
  // Every step in the file starts with "      - " (six spaces); that count must equal what was read.
  const stepLines = text.split(/\r?\n/).filter((line) => /^ {6}- /.test(line)).length
  assert.equal(jobs.reduce((sum, j) => sum + j.steps.length, 0), stepLines)
  const runs = jobs.flatMap((j) => j.steps).filter((s) => s.run)
  assert.ok(runs.length > 60, 'most steps are commands')
  assert.ok(jobs[1].steps.some((s) => s.run === 'pnpm build' && s.workingDirectory === 'client'))
  assert.ok(jobs[2].steps.some((s) => s.run.startsWith('pnpm exec jest') && s.workingDirectory === 'backend'))
  assert.ok(runs.every((s) => s.run.trim().length > 0))
})

test('install and GitHub-only steps are skipped by default, and --install runs the install', () => {
  const jobs = parseWorkflow(SAMPLE)
  const plain = planSteps(jobs, {}, here)
  assert.equal(plain.find((p) => p.step.run.startsWith('pnpm install')).action, 'skip')
  assert.ok(!plain.some((p) => p.step.uses), 'checkout and setup-node are not commands')
  assert.equal(planSteps(jobs, { install: true }, here).find((p) => p.step.run.startsWith('pnpm install')).action, 'run')
})

test('a step this computer cannot run is skipped with a reason, never silently passed', () => {
  const jobs = parseWorkflow(SAMPLE)
  const none = planSteps(jobs, {}, { bash: false, mongo: false, pathExists: () => false })
  const by = (name) => none.find((p) => p.name === name)
  assert.equal(by('Block step').action, 'skip'); assert.match(by('Block step').reason, /bash/)
  assert.equal(by('Needs mongo').action, 'skip'); assert.match(by('Needs mongo').reason, /MongoDB/)
  assert.equal(by('Needs chrome').action, 'skip'); assert.match(by('Needs chrome').reason, /Chrome/)
  assert.equal(by('Plain step').action, 'run')
  const all = planSteps(jobs, {}, here)
  assert.equal(all.find((p) => p.name === 'Needs mongo').action, 'run')
})

test('--job and --only narrow the plan', () => {
  const jobs = parseWorkflow(SAMPLE)
  assert.deepEqual(planSteps(jobs, { jobs: ['beta'] }, here).map((p) => p.job), ['beta', 'beta'])
  assert.deepEqual(planSteps(jobs, { only: 'folded' }, here).map((p) => p.name), ['Folded step'])
  assert.deepEqual(planSteps(jobs, { only: 'tests/x.test.ts' }, here).map((p) => p.name), ['Needs mongo'])
})

test('--changed picks the jobs your files can affect, and runs everything when unsure', () => {
  assert.deepEqual(jobsForChangedFiles(['client/lib/a.ts']), ['frontend'])
  assert.deepEqual(jobsForChangedFiles(['backend\\src\\a.ts']), ['backend'])
  assert.deepEqual(jobsForChangedFiles(['docs/a.md', 'README.md']), ['structure'])
  assert.deepEqual(jobsForChangedFiles(['client/a.ts', 'backend/b.ts']), ['frontend', 'backend'])
  assert.deepEqual(jobsForChangedFiles(['package.json']), ['structure', 'frontend', 'backend'])
  assert.deepEqual(jobsForChangedFiles(['client/a.ts', '.github/workflows/x.yml']), ['structure', 'frontend', 'backend'])
})

function runCli(workflow, ...args) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'ci-local-'))
  const file = path.join(dir, 'wf.yml')
  writeFileSync(file, workflow)
  return spawnSync(process.execPath, [runner, '--workflow', file, ...args], { encoding: 'utf8', cwd: root })
}
const FIXTURE = (steps) => `name: Fixture\njobs:\n  only:\n    runs-on: ubuntu-latest\n    steps:\n${steps}`

test('end to end: all-green exits 0, a failure exits 1 with its output, and the first failure stops the run', () => {
  const green = runCli(FIXTURE('      - name: A\n        run: node -e "process.exit(0)"\n'))
  assert.equal(green.status, 0, green.stdout + green.stderr)
  assert.match(green.stdout, /CI would be GREEN/)

  const steps = '      - name: Fine\n        run: node -e "process.exit(0)"\n      - name: Broken\n        run: node -e "console.log(\'boom detail\'); process.exit(1)"\n      - name: After\n        run: node -e "process.exit(0)"\n'
  const red = runCli(FIXTURE(steps))
  assert.equal(red.status, 1)
  assert.match(red.stdout, /FAILED/)
  assert.match(red.stdout, /boom detail/, 'the failing step output is shown')
  assert.match(red.stdout, /CI would be RED/)
  assert.doesNotMatch(red.stdout, /only: After/, 'stops at the first failure')

  const keepGoing = runCli(FIXTURE(steps), '--keep-going')
  assert.equal(keepGoing.status, 1)
  assert.match(keepGoing.stdout, /only: After \.\.\. ok/)
})

test('--list shows the plan and runs nothing', () => {
  const listed = runCli(FIXTURE('      - name: Would fail\n        run: node -e "process.exit(1)"\n'), '--list')
  assert.equal(listed.status, 0)
  assert.match(listed.stdout, /run\s+only #1\s+Would fail/)
})

test('an unknown option is refused instead of being ignored', () => {
  const result = spawnSync(process.execPath, [runner, '--wat'], { encoding: 'utf8', cwd: root })
  assert.equal(result.status, 2)
  assert.match(result.stderr, /Unknown option/)
})
