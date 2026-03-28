import { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const POSICOES = ['GOL', 'ZAG', 'MEI', 'ATA']

export default function AddGuestModal({ onClose, onConfirm }) {
  const [nome, setNome]     = useState('')
  const [posicao, setPosicao] = useState('MEI')
  const [rating, setRating] = useState(3)

  function handleSubmit(e) {
    e.preventDefault()
    if (!nome.trim()) return
    onConfirm({ nome: nome.trim(), posicao_campo: posicao, rating: parseFloat(rating) })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 px-4 pb-6">
      <div className="bg-card rounded-2xl w-full max-w-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-text-main font-bold text-lg">Adicionar convidado</h2>
          <button onClick={onClose} className="text-text-muted active:scale-90 transition-transform">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-1.5">
            <label className="text-text-muted text-xs font-semibold uppercase tracking-wider">Nome</label>
            <input
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Nome do convidado"
              className="w-full bg-elevated text-text-main rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
          </div>

          {/* Posição */}
          <div className="space-y-1.5">
            <label className="text-text-muted text-xs font-semibold uppercase tracking-wider">Posição</label>
            <div className="grid grid-cols-4 gap-2">
              {POSICOES.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPosicao(p)}
                  className={cn(
                    'py-2.5 rounded-xl text-xs font-bold transition-colors',
                    posicao === p ? 'bg-primary text-black' : 'bg-elevated text-text-muted'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-text-muted text-xs font-semibold uppercase tracking-wider">Rating</label>
              <span className="text-text-main font-bold text-sm">{Number(rating).toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={rating}
              onChange={e => setRating(e.target.value)}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-text-muted text-xs">
              <span>1</span><span>5</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!nome.trim()}
            className="w-full bg-primary text-black font-bold py-3 rounded-xl disabled:opacity-40 active:scale-95 transition-transform"
          >
            Adicionar
          </button>
        </form>
      </div>
    </div>
  )
}
