import { useState } from 'react'
import { X, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

const TEAM_COLORS = [
  { bg: 'bg-blue-500/20',   text: 'text-blue-400',   border: 'border-blue-500',   active: 'bg-blue-500 text-white' },
  { bg: 'bg-red-500/20',    text: 'text-red-400',    border: 'border-red-500',    active: 'bg-red-500 text-white' },
  { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500', active: 'bg-yellow-500 text-black' },
  { bg: 'bg-green-500/20',  text: 'text-green-400',  border: 'border-green-500',  active: 'bg-green-500 text-black' },
]

const POSICAO_COLOR = {
  ATA: 'bg-red-500/20 text-red-400',
  MEI: 'bg-blue-500/20 text-blue-400',
  ZAG: 'bg-yellow-500/20 text-yellow-400',
  GOL: 'bg-purple-500/20 text-purple-400',
  CORINGA: 'bg-primary/20 text-primary',
}

export default function MontagemManualModal({ presencas, onConfirm, onClose }) {
  const jogadores = presencas
    .filter(p => p.posicao <= 20)
    .sort((a, b) => a.posicao - b.posicao)

  const [assignments, setAssignments] = useState({})

  const assign = (presencaId, team) => {
    setAssignments(prev => ({
      ...prev,
      [presencaId]: prev[presencaId] === team ? null : team,
    }))
  }

  const counts = [1, 2, 3, 4].map(t => Object.values(assignments).filter(v => v === t).length)
  const allAssigned = jogadores.every(j => assignments[j.id] != null)

  function handleConfirm() {
    const teams = [1, 2, 3, 4].map(n => {
      const teamPlayers = jogadores
        .filter(j => assignments[j.id] === n)
        .map(j => j.is_guest
          ? { id: null, nome: j.guest_nome, posicao_campo: j.guest_posicao_campo, rating: j.guest_rating ?? 0 }
          : { ...j.profiles }
        )
      const ratingMedio = teamPlayers.length
        ? teamPlayers.reduce((s, p) => s + (p?.rating ?? 0), 0) / teamPlayers.length
        : 0
      return { numero: n, nome: `Time ${n}`, players: teamPlayers, ratingMedio }
    })
    onConfirm(teams)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-10 pb-4 shrink-0">
        <h2 className="text-xl font-black text-text-main uppercase tracking-widest">Montar Times</h2>
        <button onClick={onClose} className="p-2 text-text-muted">
          <X size={20} />
        </button>
      </div>

      {/* Resumo dos times */}
      <div className="grid grid-cols-4 gap-2 px-4 mb-4 shrink-0">
        {[1, 2, 3, 4].map(n => {
          const c = TEAM_COLORS[n - 1]
          return (
            <div key={n} className={cn('rounded-xl p-2 text-center', c.bg)}>
              <p className={cn('font-black text-xs uppercase', c.text)}>T{n}</p>
              <p className={cn('font-bold text-lg', c.text)}>{counts[n - 1]}</p>
            </div>
          )
        })}
      </div>

      {/* Lista de jogadores */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-4">
        {jogadores.map(j => {
          const nome       = j.is_guest ? j.guest_nome : j.profiles?.nome
          const posicao    = j.is_guest ? j.guest_posicao_campo : j.profiles?.posicao_campo
          const rating     = j.is_guest ? (j.guest_rating ?? 0) : (j.profiles?.rating ?? 0)
          const foto       = j.is_guest ? null : j.profiles?.foto_url
          const teamAssigned = assignments[j.id]

          return (
            <div key={j.id} className="bg-card rounded-2xl p-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-elevated flex items-center justify-center overflow-hidden shrink-0">
                  {foto
                    ? <img src={foto} alt={nome} className="w-full h-full object-contain" />
                    : <span className="text-xs">👤</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-text-main text-sm font-semibold truncate">{nome}</p>
                  <div className="flex items-center gap-2">
                    {posicao && (
                      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', POSICAO_COLOR[posicao])}>
                        {posicao}
                      </span>
                    )}
                    <div className="flex items-center gap-0.5">
                      <Star size={9} className="text-secondary fill-secondary" />
                      <span className="text-text-muted text-[10px]">{rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de time */}
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map(n => {
                  const c = TEAM_COLORS[n - 1]
                  const isActive = teamAssigned === n
                  return (
                    <button
                      key={n}
                      onClick={() => assign(j.id, n)}
                      className={cn(
                        'py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95',
                        isActive ? c.active : `${c.bg} ${c.text}`
                      )}
                    >
                      T{n}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-4 pb-8 pt-3 shrink-0 border-t border-border">
        <button
          onClick={handleConfirm}
          disabled={!allAssigned}
          className="w-full bg-primary text-black font-bold py-4 rounded-2xl disabled:opacity-40 active:scale-95 transition-transform"
        >
          {allAssigned ? 'Confirmar Times' : `${jogadores.length - Object.values(assignments).filter(Boolean).length} jogadores sem time`}
        </button>
      </div>
    </div>
  )
}
