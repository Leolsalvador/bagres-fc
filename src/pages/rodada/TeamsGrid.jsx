import { useState } from 'react'
import { Star, X } from 'lucide-react'
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

export default function TeamsGrid({ teams }) {
  const [selected, setSelected] = useState(null)

  return (
    <>
      <div className="space-y-3">
        <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">Times sorteados</p>
        <div className="grid grid-cols-2 gap-3">
          {teams.map((team, i) => (
            <button
              key={i}
              onClick={() => setSelected(team)}
              className={cn(
                'bg-card rounded-2xl p-3 border-t-2 text-left w-full active:scale-95 transition-transform',
                TEAM_COLORS[i].split(' ')[0]
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <p className={cn('font-black text-sm uppercase', TEAM_COLORS[i].split(' ')[1])}>
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
                {(team.players ?? []).map((p, pi) => p && (
                  <div key={p.id ?? pi} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-elevated flex items-center justify-center overflow-hidden shrink-0">
                      {p.foto_url
                        ? <img src={p.foto_url} alt={p.nome} className="w-full h-full object-contain" />
                        : <span className="text-xs">👤</span>}
                    </div>
                    <p className="text-text-main text-xs truncate">{p.nome?.split(' ')[0]}</p>
                  </div>
                ))}
              </div>
            </button>
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
