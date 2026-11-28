import { Link } from 'react-router-dom'
import { BookOpen, Flame, Shield, Sparkles, ArrowRight, Trophy, Users } from 'lucide-react'
import Logo from '@/components/Logo'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Hero */}
      <header className="border-b-2 border-royal-950 bg-gradient-to-r from-crimson-950/60 via-slate-950 to-royal-950/60 backdrop-blur px-4 sm:px-6 py-4 flex justify-between items-center gap-4">
        <div className="flex items-center gap-2 sm:gap-3 group min-w-0">
          <Logo />
          <div className="min-w-0">
            <h1 className="font-display font-black text-lg sm:text-xl leading-none group-hover:opacity-90 transition truncate">
              <span className="text-crimson-400">विधान</span>{' '}
              <span className="text-white">Bidhan</span>
            </h1>
            <p className="text-[11px] sm:text-xs text-royal-300 mt-1 tracking-wide hidden sm:block">
              Learn Nepal's Constitution
            </p>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/read"
            className="px-3 py-1.5 rounded-full text-sm font-semibold transition border border-transparent text-slate-300 hover:bg-royal-900/60 hover:text-white"
          >
            Study
          </Link>
        </nav>
      </header>

      <main className="flex-1 w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 max-w-7xl">
        {/* Value proposition */}
        <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-royal-800 bg-royal-950/60 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-royal-300">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Two ways in — pick yours
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl sm:text-5xl">
            The Constitution, on your terms
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
            Read any article right now — no account, no unlocks, no quizzes. Or sign in to unlock the
            guided path, streaks, and a little friendly competition.
          </p>
        </div>

        {/* Two entry point cards */}
        <div className="mx-auto max-w-5xl grid gap-6 sm:grid-cols-2">
          {/* Study mode card */}
          <Link
            to="/read"
            className="group relative rounded-3xl border border-slate-800 bg-slate-900 p-7 sm:p-8 shadow-2xl hover:border-royal-700 hover:bg-slate-800/60 transition"
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-crimson-500/10 to-royal-500/10 opacity-0 group-hover:opacity-100 transition" />
            <div className="relative">
              <div className="mb-5 flex items-center gap-3">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-crimson-500/20 text-crimson-400 group-hover:bg-crimson-500/30 transition">
                  <BookOpen className="h-7 w-7" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-display text-xl font-bold">Study mode</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Read, listen, bookmark — no pressure</p>
                </div>
              </div>

              <ul className="space-y-3 text-sm text-slate-300" role="list">
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true">✓</span>
                  <span>All 308 articles unlocked — pick any</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true">✓</span>
                  <span>Tick clauses, track progress, jump to sections</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true">✓</span>
                  <span>Read aloud (browser voice + online fallback)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true">✓</span>
                  <span>Resize text, bookmark, copy links, related articles</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true">✓</span>
                  <span>Your place saved on this device — no login</span>
                </li>
              </ul>

              <div className="mt-6 flex items-center justify-center">
                <span className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-bold text-royal-950 shadow-lg shadow-royal-950/40 group-hover:-translate-y-0.5 group-hover:bg-royal-50 transition">
                  Start reading free <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-3 text-center text-xs text-slate-400">
                Have a look first. Sign up whenever you&apos;re ready.
              </p>
            </div>
          </Link>

          {/* Game mode card */}
          <Link
            to="/auth"
            className="group relative rounded-3xl border border-slate-800 bg-slate-900 p-7 sm:p-8 shadow-2xl hover:border-royal-700 hover:bg-slate-800/60 transition"
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-royal-500/10 to-crimson-500/10 opacity-0 group-hover:opacity-100 transition" />
            <div className="relative">
              <div className="mb-5 flex items-center gap-3">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-royal-500/20 text-royal-400 group-hover:bg-royal-500/30 transition">
                  <Trophy className="h-7 w-7" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-display text-xl font-bold">Guided path</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Lessons, quizzes, streaks, leaderboard</p>
                </div>
              </div>

              <ul className="space-y-3 text-sm text-slate-300" role="list">
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true">✓</span>
                  <span>Structured lessons by part — build understanding step by step</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true">✓</span>
                  <span>Quiz questions with explanations after each article</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true">✓</span>
                  <span>Daily streaks, hearts, XP, and a weekly leaderboard</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true">✓</span>
                  <span>Replay completed lessons in practice mode</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true">✓</span>
                  <span>Profile with stats, badges, and achievement history</span>
                </li>
              </ul>

              <div className="mt-6 flex items-center justify-center">
                <span className="inline-flex items-center gap-2 rounded-2xl border border-royal-800 bg-royal-950/40 px-5 py-3.5 text-sm font-semibold text-royal-200 transition hover:border-royal-600 hover:bg-royal-900/50 hover:text-white">
                  Sign in to play <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-3 text-center text-xs text-slate-400">
                Free account. No ads. Your data stays yours.
              </p>
            </div>
          </Link>
        </div>

        {/* Trust strip */}
        <div className="mt-16 mx-auto max-w-3xl">
          <div className="grid gap-4 sm:grid-cols-3 text-center">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <Shield className="mx-auto h-8 w-8 text-royal-400" aria-hidden="true" />
              <h3 className="mt-3 font-semibold">Official text</h3>
              <p className="mt-1 text-xs text-slate-500">Constitution of Nepal 2072 (2015) — all 308 articles</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <Users className="mx-auto h-8 w-8 text-crimson-400" aria-hidden="true" />
              <h3 className="mt-3 font-semibold">Built for Nepalis</h3>
              <p className="mt-1 text-xs text-slate-500">English now, Nepali coming — read in your language</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <Flame className="mx-auto h-8 w-8 text-orange-400 fill-orange-400" aria-hidden="true" />
              <h3 className="mt-3 font-semibold">Learn for keeps</h3>
              <p className="mt-1 text-xs text-slate-500">Spaced repetition and active recall, not passive reading</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-royal-950 bg-slate-950/50 py-6 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>विधान Bidhan — Learn Nepal&apos;s Constitution</p>
          <div className="flex items-center gap-4">
            <a href="/read" className="hover:text-white transition">Study</a>
            <a href="/auth" className="hover:text-white transition">Sign in</a>
            <a href="#" className="hover:text-white transition">About</a>
          </div>
        </div>
      </footer>
    </div>
  )
}