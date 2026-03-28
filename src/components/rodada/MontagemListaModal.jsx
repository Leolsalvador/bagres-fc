import { useState, useEffect, useMemo } from 'react'
import { X, Search, Plus, Check, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchApprovedProfiles } from '@/lib/api'

export default function MontagemListaModal({ presencas, onAdd, onClear, onClose }) {
  const [players, setPlayers]       = useState([])
  const [search, setSearch]         = useState('')
  const [adding, setAdding]         = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    fetchApprovedProfiles().then(setPlayers).catch(console.error)
  }, [])

  const presentIds = useMemo(
    () => new Set(presencas.map(p => p.usuario_id).filter(Boolean)),
    [presencas]
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return players.filter(p =>
      !presentIds.has(p.id) &&
      (!term || p.nome.toLowerCase().includes(term))
    )
  }, [players, presentIds, search])

  async function handleAdd(player) {
    setAdding(player.id)
    await onAdd(player)
    setAdding(null)
  }

  return (
    <div className="fixed inset-0 bg-card flex flex-col z-[60]">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-10 pb-3 shrink-0">
          <h2 className="text-text-main font-bold text-lg">Montar lista</h2>
          <div className="flex items-center gap-3">
            {confirmClear ? (
              <div className="flex items-center gap-2">
                <span className="text-text-muted text-xs">Limpar tudo?</span>
                <button
                  onClick={() => { onClear(); setConfirmClear(false) }}
                  className="text-xs font-bold text-danger bg-danger/10 px-3 py-1 rounded-lg active:scale-90 transition-transform"
                >
                  Sim
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="text-xs font-bold text-text-muted bg-elevated px-3 py-1 rounded-lg active:scale-90 transition-transform"
                >
                  Não
                </button>
              </div>
            ) : presencas.length > 0 ? (
              <button
                onClick={() => setConfirmClear(true)}
                className="flex items-center gap-1.5 text-danger text-xs font-semibold active:scale-90 transition-transform"
              >
                <Trash2 size={13} /> Limpar lista
              </button>
            ) : null}
            <button onClick={onClose} className="text-text-muted active:scale-90 transition-transform">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Busca */}
        <div className="px-4 pb-3 shrink-0">
          <div className="flex items-center gap-2 bg-elevated rounded-xl px-3 py-2.5">
            <Search size={15} className="text-text-muted shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar jogador..."
              className="flex-1 bg-transparent text-text-main text-sm outline-none placeholder:text-text-muted"
              autoFocus
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-text-muted shrink-0">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Lista de jogadores */}
        <div className="overflow-y-auto px-4 pb-6 space-y-2">
          {filtered.length === 0 && (
            <p className="text-text-muted text-sm text-center py-8">
              {search ? 'Nenhum jogador encontrado.' : 'Todos os jogadores já estão na lista.'}
            </p>
          )}
          {filtered.map(player => (
            <div key={player.id} className="bg-elevated rounded-2xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-card flex items-center justify-center overflow-hidden shrink-0">
                {player.foto_url
                  ? <img src={player.foto_url} alt={player.nome} className="w-full h-full object-contain" />
                  : <span className="text-sm">👤</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text-main text-sm font-semibold truncate">{player.nome}</p>
                {player.posicao_campo && (
                  <p className="text-text-muted text-xs">{player.posicao_campo}</p>
                )}
              </div>
              <button
                onClick={() => handleAdd(player)}
                disabled={adding === player.id}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90',
                  adding === player.id
                    ? 'bg-primary/20 text-primary'
                    : 'bg-primary text-black'
                )}
              >
                {adding === player.id ? <Check size={14} /> : <Plus size={14} />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
