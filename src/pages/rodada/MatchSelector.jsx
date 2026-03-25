import { useState, useEffect } from 'react'
import { Play, Trophy, Flag, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

const COLORS = [
  { border: 'border-blue-500',   text: 'text-blue-400',   bg: 'bg-blue-500/15'   },
  { border: 'border-red-500',    text: 'text-red-400',    bg: 'bg-red-500/15'    },
  { border: 'border-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  { border: 'border-green-500',  text: 'text-green-400',  bg: 'bg-green-500/15'  },
]

export default function MatchSelector({ teams, matches, onSelect, onEndRound, suggestedIdxA, suggestedIdxB, waitingQueue = [], onFieldWinner }) {
  const initialSelected =
    suggestedIdxA != null && suggestedIdxB != null
      ? [suggestedIdxA, suggestedIdxB]
      : []
  const [selected, setSelected] = useState(initialSelected)

  useEffect(() => {
    if (suggestedIdxA != null && suggestedIdxB != null) {
      setSelected([suggestedIdxA, suggestedIdxB])
    }
  }, [suggestedIdxA, suggestedIdxB])

  function toggleTeam(idx) {
    setSelected(prev => {
      if (prev.includes(idx)) return prev.filter(i => i !== idx)
      if (prev.length >= 2) return [prev[1], idx]
      return [...prev, idx]
    })
  }

  function startMatch() {
    if (selected.length < 2) return
    onSelect({ teamA: teams[selected[0]], teamB: teams[selected[1]] })
    setSelected([])
  }

  return (
    <div className="px-4 pb-6 space-y-4">
      {onFieldWinner != null && suggestedIdxB != null ? (
        <p className="text-primary text-xs font-semibold uppercase tracking-wider">
          🏆 {teams[onFieldWinner]?.nome} continua — próximo adversário sugerido
        </p>
      ) : (
        <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">
          Selecione 2 times para jogar
        </p>
      )}

      {/* Team cards grid */}
      <div className="grid grid-cols-2 gap-3">
        {teams.map((team, i) => {
          const c = COLORS[i]
          const isSelected = selected.includes(i)
          const selOrder = selected.indexOf(i)
          const isOnField = onFieldWinner === i
          const queuePos = waitingQueue.indexOf(i)

          return (
            <button
              key={i}
              onClick={() => toggleTeam(i)}
              className={cn(
                'bg-card rounded-2xl p-3 border-2 text-left transition-all active:scale-95',
                isSelected ? `${c.border} ${c.bg}` : 'border-transparent'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <p className={cn('font-black text-sm uppercase', c.text)}>{team.nome}</p>
                {isSelected ? (
                  <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-xs font-black text-black', c.bg, c.border, 'border')}>
                    {selOrder + 1}
                  </span>
                ) : isOnField ? (
                  <span className="flex items-center gap-0.5 text-[10px] font-bold text-primary bg-primary/15 px-1.5 py-0.5 rounded-full">
                    <Shield size={9} /> Campo
                  </span>
                ) : queuePos >= 0 ? (
                  <span className="text-[10px] font-bold text-text-muted bg-elevated px-1.5 py-0.5 rounded-full">
                    Fila {queuePos + 1}º
                  </span>
                ) : null}
              </div>
              <div className="space-y-1">
                {team.players.map(p => (
                  <div key={p.id} className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-elevated flex items-center justify-center overflow-hidden shrink-0">
                      {p.foto_url
                        ? <img src={p.foto_url} alt={p.nome} className="w-full h-full object-contain" />
                        : <span className="text-[9px]">👤</span>}
                    </div>
                    <span className="text-text-muted text-xs truncate">{p.nome.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </button>
          )
        })}
      </div>

      {/* Start button */}
      <button
        onClick={startMatch}
        disabled={selected.length < 2}
        className="w-full flex items-center justify-center gap-2 bg-primary text-black font-bold py-4 rounded-2xl disabled:opacity-30 active:scale-95 transition-transform"
      >
        <Play size={18} />
        {selected.length < 2 ? 'Selecione 2 times' : `${teams[selected[0]].nome} vs ${teams[selected[1]].nome}`}
      </button>

      {/* Match history */}
      {matches.length > 0 && (
        <>
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mt-2">Partidas jogadas</p>
          {matches.map((m, i) => (
            <div key={i} className="bg-card rounded-2xl px-4 py-3 flex items-center justify-between">
              <p className="text-text-main text-sm font-semibold">{m.teamA.nome}</p>
              <div className="flex items-center gap-2">
                <span className="text-text-main font-black">{m.goalsA}</span>
                <span className="text-text-muted text-xs">x</span>
                <span className="text-text-main font-black">{m.goalsB}</span>
              </div>
              <p className="text-text-main text-sm font-semibold">{m.teamB.nome}</p>
              {m.winner === 'draw'
                ? <Flag size={14} className="text-text-muted" />
                : <Trophy size={14} className="text-secondary" />}
            </div>
          ))}
        </>
      )}

      {/* End round */}
      <button
        onClick={onEndRound}
        className="w-full border border-border text-text-muted text-sm font-semibold py-3 rounded-xl active:scale-95 transition-transform"
      >
        Finalizar rodada
      </button>
    </div>
  )
}
