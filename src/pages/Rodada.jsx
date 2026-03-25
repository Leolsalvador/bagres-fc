import { useAuth } from '@/hooks/useAuth'
import AdminRodada from './rodada/AdminRodada'
import PlayerRodada from './rodada/PlayerRodada'

export default function Rodada() {
  const { profile } = useAuth()
  return profile?.papel === 'admin' ? <AdminRodada /> : <PlayerRodada />
}
