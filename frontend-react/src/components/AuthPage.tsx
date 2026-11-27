import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, Award, BookOpenCheck, CheckCircle2, Flame, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'

import Logo from '@/components/Logo'
import { useAuthStore } from '@/store/auth'

const HIGHLIGHTS = [
  {
    icon: Flame,
    title: 'Keep the streak alive',
    text: 'A few minutes a day is all it takes.',
  },
  {
    icon: Award,
    title: 'XP, levels & leagues',
    text: 'Small wins that add up to real knowledge.',
  },
  {
    icon: Heart,
    title: 'Learn at your pace',
    text: 'Hearts, practice mode, and no pressure.',
  },
]

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
              <span className="text-crimson-400">विधान</span> <span className="text-white">Bidhan</span>
            </p>
            <p className="mt-1 text-[11px] text-royal-300">Learn Nepal&apos;s Constitution</p>
          </div>
        </div>
        <Link
          to="/read"
          className="flex items-center gap-1.5 rounded-full border border-royal-800 bg-royal-950/40 px-3 py-2 text-xs font-semibold text-royal-200 transition hover:border-royal-600 hover:text-white sm:text-sm"
        >
          <span className="hidden sm:inline">Browse free</span>
          <span className="sm:hidden">Read</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-royal-800 bg-royal-950/60 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-royal-300">
            <BookOpenCheck className="h-3.5 w-3.5" aria-hidden="true" /> Two ways in
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl">
            Explore the Constitution. Then make it stick.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
            Read any article right now — no account needed — or sign in to unlock the guided path,
            streaks, and a little friendly competition.
          </p>
        </div>

        <div className="mt-9 grid items-stretch gap-5 lg:grid-cols-2">
          <section className="group relative overflow-hidden rounded-3xl border border-royal-700/70 bg-gradient-to-br from-royal-950 via-slate-900 to-crimson-950 p-6 shadow-2xl shadow-royal-950/40 transition hover:border-royal-500 sm:p-8">
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-crimson-500/20 blur-3xl transition group-hover:bg-crimson-500/30" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-royal-500/20 blur-3xl" />

            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex rounded-2xl border border-royal-700 bg-royal-900/60 p-3 shadow-lg">
                  <BookOpenCheck className="h-7 w-7 text-royal-200" aria-hidden="true" />
                </span>
                <span className="rounded-full border border-emerald-700/50 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-300">
                  No sign-in needed
                </span>
              </div>

              <h2 className="mt-6 font-display text-2xl font-bold sm:text-3xl">Just here to read?</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-300">
                Open all <span className="font-bold text-white">308 articles</span> instantly. Search,
                listen along, tick off clauses, and save the ones you want to revisit.
              </p>

              <ul className="mt-5 space-y-2.5 text-sm text-slate-300">
                {[
                  'Every article unlocked from the start',
                  'Read aloud, resize text, and bookmark',
                  'Your place saved on this device',
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/read"
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-bold text-royal-950 shadow-lg shadow-royal-950/40 transition hover:-translate-y-0.5 hover:bg-royal-50 sm:text-base"
              >
                Start reading free <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <p className="mt-3 text-center text-xs text-slate-400">
                Have a look first. Sign up whenever you&apos;re ready.
              </p>
            </div>
          </section>

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
                  : 'Join in under a minute — it’s free.'}
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

            <div className="mt-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <span className="h-px flex-1 bg-slate-800" />
              Not ready to sign up?
              <span className="h-px flex-1 bg-slate-800" />
            </div>
            <Link
              to="/read"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-royal-800 bg-royal-950/40 px-5 py-3.5 text-sm font-semibold text-royal-200 transition hover:border-royal-600 hover:bg-royal-900/50 hover:text-white"
            >
              Continue without an account <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </section>
        </div>

        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {HIGHLIGHTS.map((h) => (
            <li
              key={h.title}
              className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
            >
              <span className="inline-flex shrink-0 rounded-xl border border-royal-800 bg-slate-950 p-2">
                <h.icon className="h-5 w-5 text-royal-300" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-bold text-slate-100">{h.title}</span>
                <span className="block text-xs text-slate-400">{h.text}</span>
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
          <Award className="h-4 w-4 text-yellow-400" aria-hidden="true" />
          Free forever · Built for learners, by learners
        </p>
      </main>
    </div>
  )
}
