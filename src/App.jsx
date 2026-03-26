import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { RodadaProvider } from '@/context/RodadaContext'
import { VotacaoProvider } from '@/context/VotacaoContext'
import { ProtectedRoute, AdminRoute } from '@/routes/ProtectedRoute'
import Layout from '@/components/layout/Layout'
import InstallPWA from '@/components/InstallPWA'

import Login from '@/pages/auth/Login'
import PendingApproval from '@/pages/PendingApproval'
import Home from '@/pages/Home'
import Rodada from '@/pages/Rodada'
import Votacao from '@/pages/Votacao'
import Perfil from '@/pages/Perfil'
import PerfilPublico from '@/pages/PerfilPublico'
import Feed from '@/pages/Feed'
import FeedPost from '@/pages/FeedPost'
import Usuarios from '@/pages/admin/Usuarios'

export default function App() {
  return (
    <>
    <BrowserRouter>
      <InstallPWA />
      <AuthProvider>
      <RodadaProvider>
      <VotacaoProvider>
        <Routes>
          {/* Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/aguardando" element={<PendingApproval />} />

          {/* Protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/rodada" element={<Rodada />} />
              <Route path="/votacao" element={<Votacao />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/jogador/:id" element={<PerfilPublico />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/feed/:postId" element={<FeedPost />} />

              {/* Apenas admin */}
              <Route element={<AdminRoute />}>
                <Route path="/admin/usuarios" element={<Usuarios />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </VotacaoProvider>
      </RodadaProvider>
      </AuthProvider>
    </BrowserRouter>
    </>
  )
}
