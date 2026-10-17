'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signUp } from '@/lib/auth-client'

export function EmailAuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter(); const [email, setEmail] = useState(''); const [name, setName] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false)
  async function submit(event: FormEvent) { event.preventDefault(); if (event.nativeEvent instanceof SubmitEvent === false) return; setLoading(true); setError(''); const result = mode === 'sign-up' ? await signUp.email({ email, password, name }) : await signIn.email({ email, password }); setLoading(false); if (result.error) { setError('We could not sign you in with those details. Please try again.'); return } router.push('/student/home'); router.refresh() }
  return <form className="auth-card" onSubmit={submit}><span className="eyebrow">{mode === 'sign-up' ? 'New explorer' : 'Welcome back'}</span><h2>{mode === 'sign-up' ? 'Create your account' : 'Sign in to Talkora'}</h2><p>{mode === 'sign-up' ? 'Save your learning adventure and progress.' : 'Your next English adventure is waiting.'}</p>{mode === 'sign-up' && <label>Your name<input required value={name} onChange={e => setName(e.target.value)} autoComplete="name" /></label>}<label>Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></label><label>Password<input required minLength={8} type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'} /></label>{error && <div className="form-error" role="alert">{error}</div>}<button className="button button-dark wide" disabled={loading}>{loading ? 'Opening your adventure...' : mode === 'sign-up' ? 'Create account' : 'Sign in'}</button></form>
}
