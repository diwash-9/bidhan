import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'

import AuthPage from '@/components/AuthPage'
import AdminArticleEditor from '@/components/AdminArticleEditor'
import AdminView from '@/components/AdminView'
import Header from '@/components/Header'
import HomePage from '@/components/HomePage'
import LeaderboardView from '@/components/LeaderboardView'
import LessonView from '@/components/LessonView'
import PathView from '@/components/PathView'
import ProfileView from '@/components/ProfileView'
import ReadArticleView from '@/components/ReadArticleView'
import ReadView from '@/components/ReadView'
import { useAuthStore } from '@/store/auth'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      // Daily-use defaults: avoid refetch storms on navigation. Individual
      // hooks override staleTime where content is static (parts: Infinity)
      // or hot (progress-summary: 15s).
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
    },
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

function RequireAdmin() {
  const { user, loading } = useAuthStore()
  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Loading…</div>
  }
  if (!user) return <Navigate to="/auth" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return <Outlet />
}

function Shell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header />
      <main className="flex-1 w-full mx-auto px-4 sm:px-6 py-6 max-w-7xl">
        {children ?? <Outlet />}
      </main>
    </div>
  )
}

function AuthGate() {
  const { user, loading } = useAuthStore()
  if (!loading && user) return <Navigate to="/" replace />
  return <AuthPage />
}

function HomeGate() {
  const { user, loading } = useAuthStore()
  if (loading) return <div className="min-h-screen bg-slate-950" />
  if (user) {
    // Authenticated users get the app shell with Header
    return (
      <Shell>
        <PathView />
      </Shell>
    )
  }
  // Guests get the standalone landing page (no global Header)
  return <HomePage />
}

function AppFallback() {
  const { user, loading } = useAuthStore()
  if (loading) return <div className="min-h-screen bg-slate-950" />
  return <Navigate to={user ? '/' : '/'} replace />
}

export default function App() {
  const { restore } = useAuthStore()
  useEffect(() => {
    void restore()
  }, [restore])

  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        {/* Public home — standalone page (no global Header) for guests; PathView for signed-in users */}
        <Route path="/" element={<HomeGate />} />

        {/* Auth pages */}
        <Route path="/auth" element={<AuthGate />} />

        {/* Protected game routes */}
        <Route element={<RequireAuth />}>
          <Route element={<Shell />}>
            <Route path="/lesson/:articleId" element={<LessonView />} />
            <Route path="/leaderboard" element={<LeaderboardView />} />
            <Route path="/profile" element={<ProfileView />} />
          </Route>
        </Route>

        {/* Study mode is public: anyone can read the Constitution as a guest. */}
        <Route element={<Shell />}>
          <Route path="/read" element={<ReadView />} />
          <Route path="/read/:articleId" element={<ReadArticleView />} />
        </Route>

        <Route element={<RequireAdmin />}>
          <Route element={<Shell />}>
            <Route path="/admin" element={<AdminView />} />
            <Route path="/admin/articles/:articleId" element={<AdminArticleEditor />} />
          </Route>
        </Route>

        <Route path="*" element={<AppFallback />} />
      </Routes>
    </QueryClientProvider>
  )
}