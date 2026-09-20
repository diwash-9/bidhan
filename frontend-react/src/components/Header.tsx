import { Flame, Heart, LogOut, Star } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { useUserProgress } from '@/hooks/useApi'
import { useAuthStore } from '@/store/auth'

export default function Header() {
  const { user, logout } = useAuthStore()
  const { data: progress } = useUserProgress()
  const location = useLocation()

  const tabs = [
    { to: '/', label: 'Path' },
    { to: '/leaderboard', label: 'Leaderboard' },
    { to: '/profile', label: 'Profile' },
  ]

  return (
    <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50 px-6 py-4 flex justify-between items-center gap-4">
      <Link to="/" className="flex items-center gap-3">
        <div className="bg-emerald-500/20 p-2 rounded-xl border border-emerald-500/30 text-emerald-400 font-bold">
          🇳🇵
        </div>
        <div>
          <h1 className="font-bold text-lg text-emerald-400">Constitution Quest</h1>
          <p className="text-xs text-slate-400">Nepal Legal Learning Path</p>
        </div>
      </Link>

      <nav className="hidden md:flex items-center gap-1">
        {tabs.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition ${
              location.pathname === t.to
                ? 'bg-emerald-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full" title="Streak">
          <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
          <span className="font-bold text-sm">{progress?.current_streak ?? user?.current_streak ?? 0}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full" title="XP">
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          <span className="font-bold text-sm">{progress?.total_xp ?? user?.total_xp ?? 0} XP</span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full" title="Hearts">
          <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
          <span className="font-bold text-sm">{progress?.hearts_left ?? 5}</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white px-2 py-1.5 rounded-full hover:bg-slate-800 transition"
          title="Log out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}