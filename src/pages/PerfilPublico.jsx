import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, Target, Handshake, Shirt } from 'lucide-react'
import { fetchProfileById } from '@/lib/api'
import { cn } from '@/lib/utils'

const POSICAO_COLOR = {
  ATA: 'bg-red-500/20 text-red-400',
  MEI: 'bg-blue-500/20 text-blue-400',
  ZAG: 'bg-yellow-500/20 text-yellow-400',
  GOL: 'bg-purple-500/20 text-purple-400',
  CORINGA: 'bg-primary/20 text-primary',
}

const POSICAO_LABEL = {
  ATA: 'Atacante', MEI: 'Meia', ZAG: 'Zagueiro', GOL: 'Goleiro', CORINGA: 'Coringa',
}

export default function PerfilPublico() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfileById(id)
      .then(setPlayer)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-full bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!player) {
    return (
      <div className="min-h-full bg-background flex flex-col items-center justify-center gap-3 px-4">
        <p className="text-text-main font-semibold">Jogador não encontrado</p>
        <button onClick={() => navigate(-1)} className="text-primary text-sm font-semibold">
          ← Voltar
        </button>
      </div>
    )
  }

  const stats = [
    { label: 'Gols',    value: player.gols ?? 0,         icon: Target,    color: 'text-primary'   },
    { label: 'Assist.', value: player.assistencias ?? 0,  icon: Handshake, color: 'text-primary'   },
    { label: 'Jogos',   value: player.jogos ?? 0,         icon: Shirt,     color: 'text-text-muted' },
    { label: 'Rating',  value: player.rating ? player.rating.toFixed(1) : '—', icon: Star, color: 'text-secondary' },
  ]

  const mediaGols = player.jogos > 0 ? (player.gols / player.jogos).toFixed(2) : '—'
  const mediaAssist = player.jogos > 0 ? (player.assistencias / player.jogos).toFixed(2) : '—'

  return (
    <div className="min-h-full bg-background pb-8">
      {/* Header */}
      <div className="px-4 pt-10 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-card flex items-center justify-center active:scale-90 transition-transform shrink-0"
        >
          <ArrowLeft size={18} className="text-text-main" />
        </button>
        <h1 className="text-2xl font-black text-text-main uppercase tracking-widest">Perfil</h1>
      </div>

      {/* Avatar + nome */}
      <div className="flex flex-col items-center py-6 px-4">
        <div className="w-28 h-28 rounded-full bg-card flex items-center justify-center overflow-hidden ring-2 ring-primary mb-4">
          {player.foto_url
            ? <img src={player.foto_url} alt={player.nome} className="w-full h-full object-contain" />
            : <span className="text-6xl">👤</span>}
        </div>

        <p className="text-text-main font-black text-2xl text-center">{player.nome}</p>

        <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
          {player.posicao_campo && (
            <span className={cn('text-xs font-bold px-3 py-1 rounded-full', POSICAO_COLOR[player.posicao_campo])}>
              {POSICAO_LABEL[player.posicao_campo]}
            </span>
          )}
          <span className={cn(
            'text-xs font-bold px-3 py-1 rounded-full',
            player.papel === 'admin' ? 'bg-secondary/20 text-secondary' : 'bg-elevated text-text-muted'
          )}>
            {player.papel === 'admin' ? 'Administrador' : 'Jogador'}
          </span>
        </div>

        {/* Rating em destaque */}
        <div className="flex items-center gap-1.5 mt-4 bg-secondary/10 px-5 py-2 rounded-full">
          <Star size={16} className="text-secondary fill-secondary" />
          <span className="text-secondary font-black text-lg">
            {player.rating ? player.rating.toFixed(1) : '—'}
          </span>
          <span className="text-text-muted text-xs">rating</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mx-4 mb-6">
        <StatCard label="Gols" value={player.gols ?? 0} icon={Target} />
        <StatCard label="Assist." value={player.assistencias ?? 0} icon={Handshake} />
        <StatCard label="Jogos" value={player.jogos ?? 0} icon={Shirt} />
      </div>

      {/* Médias por jogo */}
      {player.jogos > 0 && (
        <div className="mx-4 bg-card rounded-2xl p-4">
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-3">Médias por jogo</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-text-main text-sm">Gols por jogo</p>
              <p className="text-primary font-bold">{mediaGols}</p>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between">
              <p className="text-text-main text-sm">Assistências por jogo</p>
              <p className="text-primary font-bold">{mediaAssist}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="bg-card rounded-2xl p-4 flex flex-col items-center gap-1.5">
      <Icon size={20} className="text-primary" />
      <p className="text-text-main font-black text-2xl">{value}</p>
      <p className="text-text-muted text-xs">{label}</p>
    </div>
  )
}
