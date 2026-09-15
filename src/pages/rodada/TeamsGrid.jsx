import { useState } from 'react'
import { Star, X, Repeat2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const TEAM_COLORS = [
  'border-blue-500   text-blue-400',
  'border-red-500    text-red-400',
  'border-yellow-500 text-yellow-400',
  'border-green-500  text-green-400',
]

const POSICAO_COLOR = {
  ATA:     'bg-red-500/20    text-red-400',
  MEI:     'bg-blue-500/20   text-blue-400',
  ZAG:     'bg-yellow-500/20 text-yellow-400',
  GOL:     'bg-purple-500/20 text-purple-400',
  CORINGA: 'bg-primary/20    text-primary',
}

function recalcRating(team) {
  const players = team.players ?? []
  const ratingMedio = players.length
    ? players.reduce((s, p) => s + (p?.rating ?? 0), 0) / players.length
    : 0
  return { ...team, ratingMedio }
}

// onSwap: opcional — só passado pelo admin (tela de sorteio). Quando presente,
// habilita o modo de trocar um jogador de um time por outro de outro time.
export default function TeamsGrid({ teams, onSwap }) {
  const [selected, setSelected] = useState(null)
  const [swapMode, setSwapMode] = useState(false)
  const [swapPick, setSwapPick] = useState(null) // { teamIndex, playerIndex }

  function handleCardClick(team, teamIndex) {
    if (swapMode) return
    setSelected(team)
    void teamIndex
  }

  function handlePlayerTap(teamIndex, playerIndex) {
    if (!swapPick) {
      setSwapPick({ teamIndex, playerIndex })
      return
    }
    if (swapPick.teamIndex === teamIndex && swapPick.playerIndex === playerIndex) {
      setSwapPick(null)
      return
    }
    if (swapPick.teamIndex === teamIndex) {
      setSwapPick({ teamIndex, playerIndex })
      return
    }

    const newTeams = teams.map(t => ({ ...t, players: [...(t.players ?? [])] }))
    const teamA = newTeams[swapPick.teamIndex]
    const teamB = newTeams[teamIndex]
    const tmp = teamA.players[swapPick.playerIndex]
    teamA.players[swapPick.playerIndex] = teamB.players[playerIndex]
    teamB.players[playerIndex] = tmp
    newTeams[swapPick.teamIndex] = recalcRating(teamA)
    newTeams[teamIndex] = recalcRating(teamB)

    onSwap(newTeams)
    setSwapPick(null)
  }

  function toggleSwapMode() {
    setSwapMode(v => !v)
    setSwapPick(null)
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">Times sorteados</p>
          {onSwap && (
            <button
              onClick={toggleSwapMode}
              className={cn(
                'flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg active:scale-95 transition-transform',
                swapMode ? 'bg-primary text-black' : 'bg-card text-text-muted'
              )}
            >
              <Repeat2 size={13} /> {swapMode ? 'Concluir troca' : 'Trocar jogadores'}
            </button>
          )}
        </div>

        {swapMode && (
          <p className="text-text-muted text-xs bg-card rounded-xl px-3 py-2">
            {swapPick
              ? 'Agora toque no jogador de outro time pra completar a troca.'
              : 'Toque num jogador, depois no jogador de outro time pra trocar os dois.'}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          {teams.map((team, ti) => (
            <div
              key={ti}
              onClick={() => handleCardClick(team, ti)}
              className={cn(
                'bg-card rounded-2xl p-3 border-t-2 text-left w-full transition-transform',
                TEAM_COLORS[ti].split(' ')[0],
                !swapMode && 'active:scale-95 cursor-pointer'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <p className={cn('font-black text-sm uppercase', TEAM_COLORS[ti].split(' ')[1])}>
                  {team.nome}
                </p>
                <div className="flex items-center gap-0.5">
                  <Star size={10} className="text-secondary fill-secondary" />
                  <span className="text-text-muted text-xs">
                    {typeof team.ratingMedio === 'number' ? team.ratingMedio.toFixed(1) : '—'}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                {(team.players ?? []).map((p, pi) => {
                  if (!p) return null
                  const isPicked = swapMode && swapPick?.teamIndex === ti && swapPick?.playerIndex === pi
                  const Row = swapMode ? 'button' : 'div'
                  return (
                    <Row
                      key={p.id ?? pi}
                      onClick={swapMode ? (e) => { e.stopPropagation(); handlePlayerTap(ti, pi) } : undefined}
                      className={cn(
                        'flex items-center gap-2 w-full text-left rounded-lg',
                        swapMode && 'px-1 py-0.5 -mx-1 active:scale-95 transition-transform',
                        isPicked && 'bg-primary/20 ring-1 ring-primary'
                      )}
                    >
                      <div className="w-6 h-6 rounded-full bg-elevated flex items-center justify-center overflow-hidden shrink-0">
                        {p.foto_url
                          ? <img src={p.foto_url} alt={p.nome} className="w-full h-full object-contain" />
                          : <span className="text-xs">👤</span>}
                      </div>
                      <p className="text-text-main text-xs truncate flex-1">{p.nome?.split(' ')[0]}</p>
                      {isPicked && <Check size={12} className="text-primary shrink-0" />}
                    </Row>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de detalhe do time */}
      {selected && (
        <TeamDetailModal
          team={selected}
          colorClass={TEAM_COLORS[teams.indexOf(selected)]}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}

function TeamDetailModal({ team, colorClass, onClose }) {
  const [borderColor, textColor] = colorClass.split('   ').map(s => s.trim())

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60" onClick={onClose}>
      <div
        className="bg-card rounded-t-3xl p-6 pb-20 space-y-4 max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className={cn('font-black text-xl uppercase', textColor)}>{team.nome}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Star size={12} className="text-secondary fill-secondary" />
              <span className="text-text-muted text-sm">
                Média {typeof team.ratingMedio === 'number' ? team.ratingMedio.toFixed(1) : '—'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-text-muted">
            <X size={20} />
          </button>
        </div>

        <div className={cn('h-px', borderColor.replace('border-', 'bg-').replace('500', '500/30'))} />

        {/* Jogadores */}
        <div className="space-y-3">
          {(team.players ?? []).map((p, i) => p && (
            <div key={p.id ?? i} className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-elevated flex items-center justify-center overflow-hidden shrink-0">
                {p.foto_url
                  ? <img src={p.foto_url} alt={p.nome} className="w-full h-full object-contain" />
                  : <span className="text-base">👤</span>}
              </div>

              {/* Nome */}
              <div className="flex-1 min-w-0">
                <p className="text-text-main font-semibold text-sm truncate">{p.nome}</p>
              </div>

              {/* Posição */}
              {p.posicao_campo && (
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0', POSICAO_COLOR[p.posicao_campo])}>
                  {p.posicao_campo}
                </span>
              )}

              {/* Rating */}
              <div className="flex items-center gap-0.5 shrink-0">
                <Star size={11} className="text-secondary fill-secondary" />
                <span className="text-text-main text-sm font-bold">{(p.rating ?? 0).toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
