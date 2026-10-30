import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

function read(relativePath) {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')
}

const auth = read('../../components/auth/auth-provider.tsx')
const school = read('../../app/school/layout.tsx')
const student = read('../../app/student/layout.tsx')
const shell = read('../../components/school/school-shell.tsx')

test('first auth render is identical on server and client', () => {
  const component = auth.split('export function AuthProvider({ children }')[1]
  assert.ok(component, 'AuthProvider must exist')
  const beforeEffect = component.split('  useEffect(() => {')[0]
  assert.match(beforeEffect, /useState<AuthStatus>\('loading'\)/)
  assert.match(beforeEffect, /useState<AuthSession \| null>\(null\)/)
  assert.doesNotMatch(beforeEffect, /typeof window|getStoredToken\(|getStoredUser\(|localStorage|sessionStorage/)
  assert.doesNotMatch(auth, /suppressHydrationWarning/)
})

test('after hydration, cached sessions are restored then validated via backend', () => {
  const effect = auth.split('  useEffect(() => {')[1].split('    const invalidate')[0]
  assert.match(effect, /getStoredToken\(\) \? getStoredUser<AuthSession>\(\) : null/)
  assert.match(effect, /sessionRef\.current = cached/)
  assert.match(effect, /setSession\(cached\)/)
  assert.match(effect, /setStatus\('authenticated'\)/)
  assert.match(effect, /void restore\(\)/)
  assert.ok(effect.indexOf("setStatus('authenticated')") < effect.indexOf('void restore()'))
  assert.match(auth, /await authService\.getMe\(\)/)
  assert.match(auth, /clearSession\(\)/)
})

test('role-gated educator and student layouts remain protected', () => {
  assert.match(school, /status !== 'authenticated' \|\| !isEducator \|\| teacherOnAdminOnlyRoute/)
  assert.match(school, /role === 'SCHOOL_ADMIN' \|\| role === 'TEACHER'/)
  assert.match(student, /status !== 'authenticated' \|\| role !== 'STUDENT' \|\| !student/)
  assert.match(shell, /const \{ session, logout \} = useAuth\(\)/)
  assert.doesNotMatch(shell, /suppressHydrationWarning/)
})
