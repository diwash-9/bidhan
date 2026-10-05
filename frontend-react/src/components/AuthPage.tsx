import { useState } from 'react'
import type { FormEvent } from 'react'
import { Award, BookOpenCheck, Flame, Heart } from 'lucide-react'

import Logo from '@/components/Logo'
import { useAuthStore } from '@/store/auth'

const HIGHLIGHTS = [
  {
    icon: BookOpenCheck,
    title: '308 articles, 35 parts',
    text: 'The full Constitution as guided, bite-size lessons.',
  },
  {
    icon: Flame,
    title: 'Streaks, XP & leagues',
    text: 'Duolingo-style motivation that keeps you coming back.',
  },
  {
    icon: Heart,
    title: 'Hearts & practice',
    text: '25 hearts with quick refills, plus free practice mode.',
  },
]

export default function AuthPage() {
  const { login, register } = useAuthStore()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'register') await register(email, password, displayName)
      else await login(email, password)
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Authentication failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 sm:px-6 py-10">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-6 items-stretch">
        <section className="relative overflow-hidden rounded-3xl border border-royal-900 bg-gradient-to-br from-royal-950 via-slate-950 to-crimson-950 p-8 sm:p-10 flex flex-col justify-between">
          <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-crimson-600/20 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-royal-600/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="inline-flex rounded-2xl border border-royal-800 bg-slate-950/70 p-2.5 shadow-lg">
                <Logo className="w-10 h-10" />
              </span>
              <div>
                <h1 className="text-3xl font-black font-display leading-none">
                  <span className="text-crimson-400">विधान</span>{' '}
                  <span className="text-white">Bidhan</span>
                </h1>
                <p className="text-sm text-royal-300 mt-1">Learn Nepal&apos;s Constitution</p>
              </div>
            </div>
            <p className="mt-6 text-lg leading-relaxed text-slate-300">
              Master all <span className="font-bold text-white">308 articles</span> across{' '}
              <span className="font-bold text-white">35 parts</span> through short lessons,
              knowledge checks, and friendly competition.
            </p>
          </div>
          <ul className="relative mt-8 space-y-4">
            {HIGHLIGHTS.map((h) => (
              <li key={h.title} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex rounded-xl border border-royal-800 bg-slate-900/80 p-2">
                  <h.icon className="w-5 h-5 text-royal-300" />
                </span>
                <span>
                  <span className="block font-bold text-white text-sm">{h.title}</span>
                  <span className="block text-sm text-slate-400">{h.text}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="relative mt-8 flex items-center gap-2 text-xs text-slate-500">
            <Award className="w-4 h-4 text-yellow-400" />
            Free forever · Built for learners, by learners
          </p>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold font-display">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {mode === 'login'
                ? 'Pick up right where you left off.'
                : 'Start your streak in under a minute.'}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label htmlFor="display-name" className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Display name
                </label>
                <input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display name"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm placeholder:text-slate-600 focus:border-crimson-500 focus:outline-none transition"
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-400 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm placeholder:text-slate-600 focus:border-crimson-500 focus:outline-none transition"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-400 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={8}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm placeholder:text-slate-600 focus:border-crimson-500 focus:outline-none transition"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-crimson-600 hover:bg-crimson-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition shadow-lg shadow-crimson-900/30"
            >
              {busy ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already registered? '}
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setError(null)
              }}
              className="font-semibold text-crimson-400 hover:text-crimson-300 hover:underline transition"
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </section>
      </div>
    </div>
  )
}
