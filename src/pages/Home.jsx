import { useState, useEffect } from 'react'
import { Star, ChevronDown, ChevronUp, Trophy, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchApprovedProfiles, fetchRodadasEncerradas } from '@/lib/api'

const SORT_OPTIONS = [
  { key: 'rating',       label: 'Rating'  },
  { key: 'gols',         label: 'Gols'    },
  { key: 'assistencias', label: 'Assist.' },
  { key: 'jogos',        label: 'Jogos'   },
]

export default function Home() {
  const [tab, setTab]         = useState('jogadores')
  const [sort, setSort]       = useState('rating')
  const [players, setPlayers] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchApprovedProfiles(), fetchRodadasEncerradas()])
      .then(([ps, hs]) => { setPlayers(ps); setHistory(hs) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const sorted = [...players].sort((a, b) => b[sort] - a[sort])

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="px-4 pt-10 pb-4 flex items-center gap-3">
        <img src="/logo.png" alt="Bagres FC" className="w-12 h-12 rounded-full object-cover shrink-0" />
        <div>
          <h1 className="text-2xl font-black text-text-main uppercase tracking-widest">Bagres FC</h1>
          <p className="text-text-muted text-sm">Jogadores e histórico</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mx-4 mb-4 bg-card rounded-xl p-1">
        {['jogadores', 'rodadas'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-semibold transition-colors',
              tab === t ? 'bg-primary text-black' : 'text-text-muted'
            )}
          >
            {t === 'jogadores' ? 'Jogadores' : 'Rodadas'}
          </button>
        ))}
      </div>

      {/* ── JOGADORES ── */}
      {tab === 'jogadores' && (
        <div className="px-4 pb-6">
          {loading && <p className="text-text-muted text-sm text-center py-8">Carregando...</p>}
          {/* Sort bar */}
          <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
            {SORT_OPTIONS.map(o => (
              <button
                key={o.key}
                onClick={() => setSort(o.key)}
                className={cn(
                  'shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                  sort === o.key ? 'bg-primary text-black' : 'bg-card text-text-muted'
                )}
              >
                {o.label}
              </button>
            ))}
          </div>

          {sorted.map((p, i) => (
            <PlayerCard key={p.id} player={p} rank={i + 1} sortKey={sort} />
          ))}
        </div>
      )}

      {/* ── RODADAS ── */}
      {tab === 'rodadas' && (
        <div className="px-4 pb-6 space-y-3">
          {loading && <p className="text-text-muted text-sm text-center py-8">Carregando...</p>}
          {!loading && history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted">
              <span className="text-4xl mb-3">📋</span>
              <p className="text-sm">Nenhuma rodada encerrada ainda.</p>
            </div>
          ) : (
            history.map(r => <RodadaCard key={r.id} rodada={r} />)
          )}
        </div>
      )}
    </div>
  )
}

function PlayerCard({ player: p, rank, sortKey }) {
  const highlight = {
    rating:       `⭐ ${p.rating.toFixed(1)}`,
    gols:         `⚽ ${p.gols} gols`,
    assistencias: `🅰️ ${p.assistencias} assist.`,
    jogos:        `👟 ${p.jogos} jogos`,
  }

  return (
    <div className="bg-card rounded-2xl p-3 mb-2.5 flex items-center gap-3">
      <span className={cn(
        'text-xs font-black w-6 text-center shrink-0',
        rank === 1 ? 'text-secondary' : rank === 2 ? 'text-text-muted' : rank === 3 ? 'text-orange-400' : 'text-text-muted'
      )}>
        {rank <= 3 ? ['🥇','🥈','🥉'][rank - 1] : rank}
      </span>
      <div className="w-11 h-11 rounded-full bg-elevated flex items-center justify-center overflow-hidden shrink-0">
        {p.foto_url
          ? <img src={p.foto_url} alt={p.nome} className="w-full h-full object-contain" />
          : <span className="text-xl">👤</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-text-main font-semibold text-sm truncate">{p.nome}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-text-muted text-xs">{p.gols}G</span>
          <span className="text-text-muted text-[10px]">·</span>
          <span className="text-text-muted text-xs">{p.assistencias}A</span>
          <span className="text-text-muted text-[10px]">·</span>
          <span className="text-text-muted text-xs">{p.jogos} jogos</span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="flex items-center gap-1 justify-end">
          <Star size={12} className="text-secondary fill-secondary" />
          <span className="text-text-main font-bold text-sm">{p.rating.toFixed(1)}</span>
        </div>
        <p className={cn('text-[10px] font-semibold mt-0.5', sortKey !== 'rating' ? 'text-primary' : 'text-text-muted')}>
          {sortKey !== 'rating' ? highlight[sortKey] : ''}
        </p>
      </div>
    </div>
  )
}

function RodadaCard({ rodada: r }) {
  const [open, setOpen] = useState(false)

  const dateLabel = new Date(r.data_jogo + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="bg-card rounded-2xl overflow-hidden">
      {/* Cabeçalho */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full p-4 flex items-center justify-between active:bg-elevated transition-colors"
      >
        <div className="text-left">
          <p className="text-text-muted text-xs">{dateLabel}</p>
          <p className="text-text-main font-bold text-sm mt-0.5">
            {r.timeDaRodada ? `🏆 ${r.timeDaRodada.nome}` : `⚽ ${r.partidas.length} partida${r.partidas.length !== 1 ? 's' : ''}`}
            <span className="text-text-muted font-normal"> — {r.timeDaRodada ? 'Time da Rodada' : 'encerrada'}</span>
          </p>
        </div>
        {open ? <ChevronUp size={16} className="text-text-muted shrink-0" /> : <ChevronDown size={16} className="text-text-muted shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border">
          {/* Destaques */}
          {(r.artilheiro || r.garcom) && (
            <div className="grid grid-cols-2 gap-2 pt-3">
              {r.artilheiro && (
                <div className="bg-elevated rounded-xl p-3">
                  <p className="text-text-muted text-[10px] font-semibold uppercase">Artilheiro ⚽</p>
                  <p className="text-primary font-bold text-sm mt-1 truncate">{r.artilheiro.nome}</p>
                  <p className="text-text-muted text-xs">{r.artilheiro.gols} gols</p>
                </div>
              )}
              {r.garcom && (
                <div className="bg-elevated rounded-xl p-3">
                  <p className="text-text-muted text-[10px] font-semibold uppercase">Garçom 🅰️</p>
                  <p className="text-secondary font-bold text-sm mt-1 truncate">{r.garcom.nome}</p>
                  <p className="text-text-muted text-xs">{r.garcom.assistencias} assist.</p>
                </div>
              )}
            </div>
          )}

          {/* Partidas */}
          <p className="text-text-muted text-[10px] font-semibold uppercase tracking-wider">Partidas</p>
          {r.partidas.map((m, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <p className="text-text-main flex-1 truncate">{m.teamA}</p>
              <div className="flex items-center gap-1.5 mx-3 shrink-0">
                <span className="text-text-main font-black">{m.goalsA}</span>
                <span className="text-text-muted text-xs">×</span>
                <span className="text-text-main font-black">{m.goalsB}</span>
                {m.winner === 'draw'
                  ? <Flag size={12} className="text-text-muted ml-1" />
                  : <Trophy size={12} className="text-secondary ml-1" />}
              </div>
              <p className="text-text-main flex-1 truncate text-right">{m.teamB}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
