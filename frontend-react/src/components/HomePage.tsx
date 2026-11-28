import { Link } from 'react-router-dom'
import { BookOpen, Flame, Shield, Trophy, Users, ArrowRight } from 'lucide-react'
import Logo from '@/components/Logo'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header - clean, just logo */}
      <header className="border-b border-royal-950/50 bg-slate-950/80 backdrop-blur px-4 sm:px-6 py-4">
        <div className="mx-auto max-w-7xl flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3 group">
            <Logo />
            <div className="min-w-0 hidden sm:block">
              <h1 className="font-display font-black text-lg sm:text-xl leading-none group-hover:opacity-90 transition truncate">
                <span className="text-crimson-400">विधान</span>{' '}
                <span className="text-white">Bidhan</span>
              </h1>
              <p className="text-[11px] sm:text-xs text-royal-300 mt-0.5 tracking-wide">
                Learn Nepal's Constitution
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full mx-auto px-4 sm:px-6 py-12 sm:py-16 max-w-7xl">
        {/* Hero - direct and clear */}
        <div className="mx-auto max-w-3xl text-center mb-14 sm:mb-20">
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
            Nepal&apos;s Constitution, <span className="text-crimson-400">readable</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base sm:text-lg leading-relaxed text-slate-400">
            All 308 articles. Search, listen, bookmark: no account required.
            Want structure? Sign in for guided lessons, quizzes, and progress tracking.
          </p>
        </div>

        {/* Primary actions - side by side, equal weight */}
        <div className="mx-auto max-w-5xl grid gap-6 sm:grid-cols-2 mb-16 sm:mb-20">
          {/* Read card - primary action */}
          <Link
            to="/read"
            className="group relative rounded-2xl border border-slate-800 bg-slate-900 p-7 sm:p-8 shadow-xl hover:border-royal-700/50 hover:bg-slate-800/50 transition-all duration-200"
          >
            <div className="flex items-start gap-4">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-crimson-500/15 text-crimson-400 group-hover:bg-crimson-500/25 transition-colors">
                <BookOpen className="h-6 w-6" aria-hidden="true" />
              </span>
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-xl font-bold">Read the Constitution</h2>
                <p className="mt-1 text-sm text-slate-400">No sign-in. No unlocks. Just the text.</p>

                <ul className="mt-5 space-y-2.5 text-sm text-slate-300" role="list">
                  <li className="flex items-center gap-2.5">
                    <span className="h-4 w-4 shrink-0 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                    <span>All 308 articles, searchable by part, number, or keyword</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="h-4 w-4 shrink-0 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                    <span>Read aloud: browser voice with online fallback</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="h-4 w-4 shrink-0 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                    <span>Tick clauses, bookmark, resize text, copy links</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="h-4 w-4 shrink-0 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                    <span>Progress saved locally on this device</span>
                  </li>
                </ul>

                <div className="mt-6">
                  <span className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-royal-950 shadow-lg shadow-royal-950/30 group-hover:shadow-xl group-hover:shadow-royal-950/40 transition-shadow">
                    Start reading <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* Play card - secondary action */}
          <Link
            to="/auth"
            className="group relative rounded-2xl border border-slate-800 bg-slate-900 p-7 sm:p-8 shadow-xl hover:border-royal-700/50 hover:bg-slate-800/50 transition-all duration-200"
          >
            <div className="flex items-start gap-4">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-royal-500/15 text-royal-400 group-hover:bg-royal-500/25 transition-colors">
                <Trophy className="h-6 w-6" aria-hidden="true" />
              </span>
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-xl font-bold">Guided Learning Path</h2>
                <p className="mt-1 text-sm text-slate-400">Lessons, quizzes, streaks: make it stick</p>

                <ul className="mt-5 space-y-2.5 text-sm text-slate-300" role="list">
                  <li className="flex items-center gap-2.5">
                    <span className="h-4 w-4 shrink-0 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                    <span>Structured lessons following the Constitution&apos;s dependency graph</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="h-4 w-4 shrink-0 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                    <span>Quiz questions with explanations after every article</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="h-4 w-4 shrink-0 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                    <span>Daily streaks, XP, hearts, weekly leaderboard</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="h-4 w-4 shrink-0 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                    <span>Practice mode: replay any completed lesson</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="h-4 w-4 shrink-0 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                    <span>Profile with stats, badges, achievement history</span>
                  </li>
                </ul>

                <div className="mt-6">
                  <span className="inline-flex items-center gap-2 rounded-xl border border-royal-800 bg-royal-950/30 px-5 py-3 text-sm font-semibold text-royal-200 transition hover:border-royal-600 hover:bg-royal-900/40 hover:text-white">
                    Sign in to play <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-2 text-center text-xs text-slate-500">Free account. No ads. Your data stays yours.</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Credibility strip - understated */}
        <div className="mx-auto max-w-4xl border-t border-royal-950/50 pt-12">
          <div className="grid gap-6 sm:grid-cols-3 text-center">
            <div className="p-4">
              <Shield className="mx-auto h-8 w-8 text-royal-400/80" aria-hidden="true" />
              <h3 className="mt-3 font-semibold text-sm">Official Text</h3>
              <p className="mt-1 text-xs text-slate-500">Constitution of Nepal 2072 (2015): all 308 articles</p>
            </div>
            <div className="p-4">
              <Users className="mx-auto h-8 w-8 text-crimson-400/80" aria-hidden="true" />
              <h3 className="mt-3 font-semibold text-sm">Built for Nepalis</h3>
              <p className="mt-1 text-xs text-slate-500">English now, Nepali coming: read in your language</p>
            </div>
            <div className="p-4">
              <Flame className="mx-auto h-8 w-8 text-orange-400/80 fill-orange-400/80" aria-hidden="true" />
              <h3 className="mt-3 font-semibold text-sm">Learn for Keeps</h3>
              <p className="mt-1 text-xs text-slate-500">Spaced repetition and active recall, not passive reading</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-royal-950/50 bg-slate-950/50 py-6 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>विधान Bidhan — Learn Nepal&apos;s Constitution</p>
          <div className="flex items-center gap-4">
            <a href="/read" className="hover:text-white transition">Read</a>
            <a href="/auth" className="hover:text-white transition">Sign in</a>
            <a href="#" className="hover:text-white transition">About</a>
          </div>
        </div>
      </footer>
    </div>
  )
}