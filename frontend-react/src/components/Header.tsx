import { useEffect, useState } from 'react'
import { Flame, Heart, LogOut, Menu, Star, Volume2, VolumeX, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import RefillCountdown from '@/components/RefillCountdown'
import { useProgressSummary } from '@/hooks/useApi'
import { isSoundMuted, setSoundMuted } from '@/lib/sfx'
import { useAuthStore } from '@/store/auth'

function FlagMark() {
  return (
    <svg viewBox="0 0 24 24" className="w-9 h-9" aria-hidden="true">
      <path
        d="M4 3h15.8l-4 4.6 4 4.6H4V3z"
        fill="#dc143c"
        stroke="#1e2f89"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M4 12.8h12l-6 7.4-6-7.4z"
        fill="#dc143c"
        stroke="#1e2f89"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <g transform="translate(11.6 5.4) scale(0.62)">
        <circle cx="3" cy="2.5" r="2.1" fill="#fff" />
        <path d="M2 0.6a2.4 2.4 0 0 0 0 3.8 1.9 1.9 0 0 1 0-3.8z" fill="#dc143c" />
      </g>
      <g transform="translate(10.2 13.6) scale(0.62)">
        <circle cx="2.6" cy="2.6" r="2.2" fill="#fff" />
        <path d="M1.8 1a2.6 2.6 0 0 0 0 3.2 2 2 0 0 1 0-3.2z" fill="#dc143c" />
      </g>
    </svg>
  )
}

export default function Header() {
  const { user, logout } = useAuthStore()
  // Lightweight (<0.5KB) instead of the 308-row full progress payload.
  const { data: progress, refetch } = useProgressSummary()
  const location = useLocation()
  const [soundMuted, setMuted] = useState(isSoundMuted())

  useEffect(() => {
    setMuted(isSoundMuted())
  }, [])

  const toggleSound = () => {
    const next = !soundMuted
    setSoundMuted(next)
    setMuted(next)
  }

  const heartsLeft = progress?.hearts_left ?? progress?.max_hearts ?? 25
  const maxHearts = progress?.max_hearts ?? 25
  const heartsFull = heartsLeft >= maxHearts

  const tabs = [
    { to: '/', label: 'Path' },
    { to: '/leaderboard', label: 'Leaderboard' },
    { to: '/profile', label: 'Profile' },
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin' }] : []),
  ]
  const isActive = (to: string) => (to === '/' ? location.pathname === '/' : location.pathname.startsWith(to))
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <header className="sticky top-0 z-50">
      <div className="border-b-2 border-royal-950 bg-gradient-to-r from-crimson-950/60 via-slate-950 to-royal-950/60 backdrop-blur px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-2 sm:gap-4">
      <Link to="/" className="flex items-center gap-2 sm:gap-3 group min-w-0">
        <FlagMark />
        <div className="min-w-0">
          <h1 className="font-display font-black text-lg sm:text-xl leading-none group-hover:opacity-90 transition truncate">
            <span className="text-crimson-400">विधान</span>{' '}
            <span className="text-white">Bidhan</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-royal-300 mt-1 tracking-wide hidden sm:block">
            Learn Nepal's Constitution
          </p>
        </div>
      </Link>

      <nav className="hidden md:flex items-center gap-1">
        {tabs.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            aria-current={isActive(t.to) ? 'page' : undefined}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition border ${
              isActive(t.to)
                ? 'bg-crimson-600 border-crimson-500 text-white shadow-lg shadow-crimson-900/30'
                : 'border-transparent text-slate-300 hover:bg-royal-900/60 hover:text-white'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-1.5 sm:gap-3">
        <div
          className="hidden sm:flex items-center gap-1.5 bg-slate-900 border border-royal-900 px-2.5 sm:px-3 py-1.5 rounded-full"
          title="Streak"
        >
          <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
          <span className="font-bold text-sm">{progress?.current_streak ?? user?.current_streak ?? 0}</span>
        </div>
        <div
          className="hidden sm:flex items-center gap-1.5 bg-slate-900 border border-royal-900 px-2.5 sm:px-3 py-1.5 rounded-full"
          title="XP"
        >
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          <span className="font-bold text-sm">{progress?.total_xp ?? user?.total_xp ?? 0}</span>
        </div>
        <span className="relative group">
          <div
            className="flex items-center gap-1.5 bg-slate-900 border border-crimson-900 px-2.5 sm:px-3 py-1.5 rounded-full cursor-default"
            title={heartsFull ? 'Hearts full' : 'Heart refills over time'}
          >
            <Heart className="w-5 h-5 text-crimson-500 fill-crimson-500" />
            <span className="font-bold text-sm">
              {heartsLeft}/{maxHearts}
            </span>
          </div>
          {!heartsFull && progress?.hearts_refill_at && (
            <span className="absolute right-0 top-full mt-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap bg-slate-800 border border-royal-800 text-royal-200 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition pointer-events-none shadow-xl z-50">
              Next heart in{' '}
              <RefillCountdown refillAt={progress.hearts_refill_at} onExpire={() => void refetch()} className="text-crimson-300 font-bold" />
            </span>
          )}
        </span>
        <button
          onClick={toggleSound}
          aria-label={soundMuted ? 'Unmute sounds' : 'Mute sounds'}
          aria-pressed={soundMuted}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white p-1.5 sm:px-2 sm:py-1.5 rounded-full hover:bg-royal-900/60 transition"
          title={soundMuted ? 'Sound off' : 'Sound on'}
        >
          {soundMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
        <button
          onClick={logout}
          aria-label="Log out"
          className="flex items-center gap-1.5 text-slate-400 hover:text-white p-1.5 sm:px-2 sm:py-1.5 rounded-full hover:bg-royal-900/60 transition"
          title="Log out"
        >
          <LogOut className="w-5 h-5" />
        </button>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          className="md:hidden flex items-center justify-center text-slate-200 hover:text-white p-2 rounded-full hover:bg-royal-900/60 transition"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      </div>

      {menuOpen && (
        <nav
          aria-label="Mobile"
          className="md:hidden border-b border-royal-950 bg-slate-950/95 backdrop-blur shadow-2xl shadow-black/50">
          <div className="px-4 py-3 flex flex-col gap-1">
            {tabs.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                aria-current={isActive(t.to) ? 'page' : undefined}
                className={`px-4 py-3 rounded-xl text-base font-semibold transition border ${
                  isActive(t.to)
                    ? 'bg-crimson-600 border-crimson-500 text-white shadow-lg shadow-crimson-900/30'
                    : 'border-transparent text-slate-200 hover:bg-royal-900/60 hover:text-white'
                }`}
              >
                {t.label}
              </Link>
            ))}
            <div className="flex items-center gap-3 px-4 pt-3 mt-1 border-t border-royal-950 text-sm">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                {progress?.current_streak ?? user?.current_streak ?? 0}
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                {progress?.total_xp ?? user?.total_xp ?? 0} XP
              </span>
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}