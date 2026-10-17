'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AuthFrame } from '@/components/auth/auth-frame'
import { useAuth } from '@/components/auth/auth-provider'

export default function SchoolLoginPage() {
  const router = useRouter()
  const { loginSchool } = useAuth()
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await loginSchool(code.trim().toUpperCase(), password)
      router.replace('/school/dashboard')
    } catch (err: any) {
      setError(err.message || 'Invalid school credentials. Please check your school code and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFrame
      title="Your classroom starts here."
      subtitle="Manage students, celebrate progress, and make every English lesson count."
      pose="standing"
      badgeText="School Admin Portal"
    >
      <form className="auth-card" onSubmit={handleSubmit}>
        <span className="eyebrow">School Management Portal</span>
        <h2>Welcome, School!</h2>
        <p>Let&apos;s get your Talkora classrooms and students ready.</p>

        <label>
          School Code
          <input
            required
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="YOUR SCHOOL CODE"
          />
        </label>

        <label>
          Password
          <div className="input-with-action">
            <input
              required
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        <button className="button button-dark wide" disabled={loading} type="submit">
          {loading ? 'Logging in...' : 'Login as School'}
        </button>


        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '13px' }}>
          <Link className="back-link" href="/login/teacher">Teacher Login →</Link>
          <Link className="back-link" href="/login/student">Student Login →</Link>
        </div>
      </form>
    </AuthFrame>
  )
}
