// Run only with explicit staging approval. k6 is an external tool, not bundled.
import http from 'k6/http'
import { sleep, check } from 'k6'
import { SharedArray } from 'k6/data'

const base = (__ENV.TALKORA_STAGING_URL || '').replace(/\/$/, '')
const approved = (__ENV.TALKORA_APPROVED_STAGING_URL || '').replace(/\/$/, '')
if (__ENV.TALKORA_LOAD_TEST_ACK !== 'STAGING' || !base || !approved || base !== approved ||
    !/^https:\/\//.test(base) || !__ENV.TALKORA_TEST_TOKENS_FILE) {
  throw Error('Refusing test: specify matching HTTPS STAGING and APPROVED URLs, TEST_TOKENS_FILE, and TALKORA_LOAD_TEST_ACK=STAGING')
}
const vus = Number(__ENV.TALKORA_VUS || 20)
if (!Number.isSafeInteger(vus) || vus < 1 || vus > 10000) throw Error('TALKORA_VUS must be 1..10000')
const tokens = new SharedArray('authorized-staging-students', () => {
  const parsed = JSON.parse(open(__ENV.TALKORA_TEST_TOKENS_FILE))
  if (!Array.isArray(parsed) || !parsed.length || parsed.some(item => !item || typeof item.token !== 'string' || ![0,1,2,3,4,5,6,7,8,9,10].includes(item.grade))) {
    throw Error('Token file must contain [{"token":"...","grade":0..10}] of TEST accounts')
  }
  return parsed
})
if (tokens.length < vus) throw Error('Supply at least as many distinct test accounts as VUs')
export const options = {
  vus, duration: __ENV.TALKORA_DURATION || '2m',
  thresholds: { http_req_failed: ['rate<0.01'], 'http_req_duration': ['p(95)<1500'] },
  discardResponseBodies: true,
}

export default function () {
  const student = tokens[(__VU - 1) % tokens.length]
  const headers = { Authorization: `Bearer ${student.token}` }
  const route = student.grade === 0 ? '/api/v1/kg-alphabet/state' : '/api/v1/progress/recommendation'
  const response = http.get(`${base}${route}`, { headers, tags: { route, grade: String(student.grade) } })
  check(response, { 'authorized progress read succeeded': r => r.status === 200 })
  sleep(3) // Realistic think time; adjust for your expected lab usage.
}
