import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'

import AuthPage from '@/components/AuthPage'
import Header from '@/components/Header'
import LeaderboardView from '@/components/LeaderboardView'
import LessonView from '@/components/LessonView'
import PathView from '@/components/PathView'
import ProfileView from '@/components/ProfileView'
import { useAuthStore } from '@/store/auth'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
})

function RequireAuth() {
  const { user, loading } = useAuthStore()
  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Loading…</div>
  }
  if (!user) return <Navigate to="/auth" replace />
  return <Outlet />
}

function Shell() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header />
      <main className="flex-1 max-w-3xl w-full mx-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}

function AuthGate() {
  const { user, loading } = useAuthStore()
  if (!loading && user) return <Navigate to="/" replace />
  return <AuthPage />
}

export default function App() {
  const { restore } = useAuthStore()
  useEffect(() => {
    void restore()
  }, [restore])

  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/auth" element={<AuthGate />} />
        <Route element={<RequireAuth />}>
          <Route element={<Shell />}>
            <Route path="/" element={<PathView />} />
            <Route path="/lesson/:articleId" element={<LessonView />} />
            <Route path="/leaderboard" element={<LeaderboardView />} />
            <Route path="/profile" element={<ProfileView />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </QueryClientProvider>
  )
}