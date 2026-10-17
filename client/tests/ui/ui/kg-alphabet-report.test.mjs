import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const report = await readFile(new URL('../../../components/school/kg-alphabet-report.tsx', import.meta.url), 'utf8')

test('KG teacher report shows active time, replay time, and per-letter timing', () => {
  assert.match(report, /timeSpentMs/)
  assert.match(report, /replayTimeSpentMs/)
  assert.match(report, /Active time:/)
  assert.match(report, /Replay time:/)
  assert.match(report, /\['Letter', 'Attempts', 'Correct', 'Retries', 'Unclear', 'Time', 'Accuracy'\]/)
})
