import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

const TELESPECTADOR_ROUTES = ['/feed', '/campeonato']

function Spinner() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export function ProtectedRoute() {
  const { user, profile, loading } = useAuth()

  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (!profile || profile.status === 'pendente') return <Navigate to="/aguardando" replace />

  return <Outlet />
}

// Bloqueia telespectadores de rotas exclusivas de jogadores
export function JogadorRoute() {
  const { profile, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner />

  if (profile?.papel === 'telespectador') {
    const allowed = TELESPECTADOR_ROUTES.some(r => location.pathname.startsWith(r))
    if (!allowed) return <Navigate to="/campeonato" replace />
  }

  return <Outlet />
}

export function AdminRoute() {
  const { profile, loading } = useAuth()

  if (loading) return <Spinner />
  if (!profile || profile.papel !== 'admin') return <Navigate to="/home" replace />

  return <Outlet />
}
