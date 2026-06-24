import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { RodadaProvider } from '@/context/RodadaContext'
import { VotacaoProvider } from '@/context/VotacaoContext'
import { CampeonatoProvider } from '@/context/CampeonatoContext'
import { ProtectedRoute, AdminRoute, JogadorRoute } from '@/routes/ProtectedRoute'
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
import CampeonatoHub from '@/pages/campeonato/CampeonatoHub'
import VotacaoMVP from '@/pages/campeonato/VotacaoMVP'
import GestaoCampeonato from '@/pages/admin/campeonato/GestaoCampeonato'
import ControlePartida from '@/pages/admin/campeonato/ControlePartida'

export default function App() {
  return (
    <>
    <BrowserRouter>
      <InstallPWA />
      <AuthProvider>
      <RodadaProvider>
      <VotacaoProvider>
      <CampeonatoProvider>
        <Routes>
          {/* Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/aguardando" element={<PendingApproval />} />

          {/* Protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>

              {/* Acessíveis a todos (jogadores + telespectadores) */}
              <Route path="/feed" element={<Feed />} />
              <Route path="/feed/:postId" element={<FeedPost />} />
              <Route path="/campeonato" element={<CampeonatoHub />} />
              <Route path="/campeonato/partida/:partidaId" element={<VotacaoMVP />} />

              {/* Exclusivas de jogadores — bloqueadas para telespectador */}
              <Route element={<JogadorRoute />}>
                <Route path="/home" element={<Home />} />
                <Route path="/rodada" element={<Rodada />} />
                <Route path="/votacao" element={<Votacao />} />
                <Route path="/perfil" element={<Perfil />} />
                <Route path="/jogador/:id" element={<PerfilPublico />} />
              </Route>

              {/* Apenas admin */}
              <Route element={<AdminRoute />}>
                <Route path="/admin/usuarios" element={<Usuarios />} />
                <Route path="/admin/campeonato" element={<GestaoCampeonato />} />
                <Route path="/admin/campeonato/controle" element={<ControlePartida />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </CampeonatoProvider>
      </VotacaoProvider>
      </RodadaProvider>
      </AuthProvider>
    </BrowserRouter>
    </>
  )
}
