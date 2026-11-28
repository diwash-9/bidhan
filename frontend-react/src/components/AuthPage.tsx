import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import Logo from '@/components/Logo'
import { useAuthStore } from '@/store/auth'

const inputClass =
  'w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 transition focus:border-crimson-500 focus:outline-none focus:ring-2 focus:ring-crimson-500/20'

export default function AuthPage() {
  const { login, register } = useAuthStore()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const switchMode = (next: 'login' | 'register') => {
    setMode(next)
    setError(null)
  }

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
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-[10%] h-96 w-96 rounded-full bg-royal-700/20 blur-3xl" />
        <div className="absolute -bottom-40 right-[10%] h-96 w-96 rounded-full bg-crimson-700/20 blur-3xl" />
      </div>

      <header className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-6 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex rounded-2xl border border-royal-800 bg-slate-900/80 p-2 shadow-lg">
            <Logo className="h-9 w-9" />
          </span>
          <div>
            <p className="font-display text-xl font-black leading-none">
              <span className="text-crimson-400">विधान</span>{' '}
              <span className="text-white">Bidhan</span>
            </p>
            <p className="mt-1 text-[11px] text-royal-300">Learn Nepal&apos;s Constitution</p>
          </div>
        </div>
        <Link
          to="/"
          className="flex items-center gap-1.5 rounded-full border border-royal-800 bg-royal-950/40 px-3 py-2 text-xs font-semibold text-royal-200 transition hover:border-royal-600 hover:text-white sm:text-sm"
        >
          <span className="hidden sm:inline">Back to home</span>
          <span className="sm:hidden">Home</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl sm:p-8">
          <div role="tablist" aria-label="Account access" className="flex rounded-2xl border border-slate-800 bg-slate-950 p-1">
            <button
              id="tab-login"
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              aria-controls="auth-form"
              onClick={() => switchMode('login')}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                mode === 'login' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Log in
            </button>
            <button
              id="tab-register"
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              aria-controls="auth-form"
              onClick={() => switchMode('register')}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                mode === 'register' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Create account
            </button>
          </div>

          <div className="mt-6">
            <h2 className="font-display text-2xl font-bold">
              {mode === 'login' ? 'Welcome back' : 'Start your streak'}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {mode === 'login'
                ? 'Pick up right where you left off.'
                : 'Join in under a minute: it&apos;s free.'}
            </p>
          </div>

          <form
            id="auth-form"
            role="tabpanel"
            aria-labelledby={mode === 'login' ? 'tab-login' : 'tab-register'}
            onSubmit={submit}
            className="mt-5 space-y-4"
          >
            {mode === 'register' && (
              <div>
                <label htmlFor="display-name" className="mb-1.5 block text-xs font-semibold text-slate-400">
                  Display name
                </label>
                <input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="What should we call you?"
                  autoComplete="nickname"
                  required
                  className={inputClass}
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-slate-400">
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
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-slate-400">
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
                className={inputClass}
              />
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-crimson-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-crimson-900/30 transition hover:bg-crimson-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'Please wait…' : mode === 'login' ? 'Log in & continue' : 'Create my account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition"
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
              Back to home
            </Link>
            <p className="mt-2 text-xs text-slate-500">Or just <span className="font-semibold">start reading</span>: no account needed</p>
          </div>
        </section>
      </main>
    </div>
  )
}