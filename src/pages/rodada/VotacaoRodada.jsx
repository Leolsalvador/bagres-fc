import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useRodada } from '@/context/RodadaContext'
import { useAuth } from '@/hooks/useAuth'

export default function VotacaoRodada({ lista }) {
  const { votacaoRodadaAberta, votosRodada, meuVotoRodada, votarRodada } = useRodada()
  const { profile } = useAuth()

  const [selMelhor, setSelMelhor] = useState(null)
  const [selBagre, setSelBagre]   = useState(null)

  if (!votacaoRodadaAberta) return null

  const isParticipante = lista.some(p => p.usuario_id === profile?.id)
  const jaVotou = meuVotoRodada.melhor !== null && meuVotoRodada.bagre !== null
  const candidates = lista.filter(p => p.usuario_id !== profile?.id)

  function confirmar() {
    if (!selMelhor || !selBagre || selMelhor === selBagre) return
    votarRodada({ melhor: selMelhor, bagre: selBagre })
  }

  // ── Resultados (após votar) ───────────────────────────────
  if (jaVotou) {
    const melhorRanking = [...candidates]
      .map(p => ({ id: p.usuario_id, nome: p.profiles?.nome, votos: votosRodada.melhor[p.usuario_id] ?? 0 }))
      .sort((a, b) => b.votos - a.votos)

    const bagreRanking = [...candidates]
      .map(p => ({ id: p.usuario_id, nome: p.profiles?.nome, votos: votosRodada.bagre[p.usuario_id] ?? 0 }))
      .sort((a, b) => b.votos - a.votos)

    return (
      <div className="space-y-4 mt-4">
        <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">Votação da Rodada</p>

        <RankingCard
          emoji="⭐"
          title="Melhor da Rodada"
          titleColor="text-secondary"
          leaderColor="text-secondary"
          ranking={melhorRanking}
        />
        <RankingCard
          emoji="🐟"
          title="Bagre da Rodada"
          titleColor="text-danger"
          leaderColor="text-danger"
          ranking={bagreRanking}
        />
      </div>
    )
  }

  // ── Não participou ────────────────────────────────────────
  if (!isParticipante) {
    return (
      <div className="mt-4 bg-card rounded-2xl p-4 text-center space-y-1">
        <p className="text-text-main font-semibold text-sm">Votação da Rodada</p>
        <p className="text-text-muted text-xs">Você não participou desta rodada.</p>
      </div>
    )
  }

  // ── Formulário de voto ────────────────────────────────────
  const canConfirm = selMelhor && selBagre && selMelhor !== selBagre

  return (
    <div className="space-y-4 mt-4">
      <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">Votação da Rodada</p>

      {/* Melhor */}
      <div className="bg-card rounded-2xl p-4 space-y-3">
        <div>
          <p className="text-secondary font-bold text-sm">⭐ Melhor da Rodada</p>
          <p className="text-text-muted text-xs mt-0.5">Quem foi o melhor jogador?</p>
        </div>
        <div className="space-y-2">
          {candidates.map(p => (
            <PlayerOption
              key={p.usuario_id}
              presenca={p}
              selected={selMelhor === p.usuario_id}
              disabled={selBagre === p.usuario_id}
              selectedColor="border-secondary bg-secondary/10"
              checkColor="text-secondary"
              onSelect={() => setSelMelhor(p.usuario_id)}
            />
          ))}
        </div>
      </div>

      {/* Bagre */}
      <div className="bg-card rounded-2xl p-4 space-y-3">
        <div>
          <p className="text-danger font-bold text-sm">🐟 Bagre da Rodada</p>
          <p className="text-text-muted text-xs mt-0.5">Quem foi o pior jogador?</p>
        </div>
        <div className="space-y-2">
          {candidates.map(p => (
            <PlayerOption
              key={p.usuario_id}
              presenca={p}
              selected={selBagre === p.usuario_id}
              disabled={selMelhor === p.usuario_id}
              selectedColor="border-danger bg-danger/10"
              checkColor="text-danger"
              onSelect={() => setSelBagre(p.usuario_id)}
            />
          ))}
        </div>
      </div>

      <button
        onClick={confirmar}
        disabled={!canConfirm}
        className="w-full bg-primary text-black font-bold py-4 rounded-2xl disabled:opacity-30 active:scale-95 transition-transform"
      >
        Confirmar votos ✓
      </button>
    </div>
  )
}

function PlayerOption({ presenca, selected, disabled, selectedColor, checkColor, onSelect }) {
  const p = presenca.profiles
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-xl border transition-colors active:scale-95',
        selected ? selectedColor : 'border-border bg-elevated',
        disabled && 'opacity-30 pointer-events-none',
      )}
    >
      <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center overflow-hidden shrink-0">
        {p?.foto_url
          ? <img src={p.foto_url} alt={p.nome} className="w-full h-full object-contain" />
          : <span className="text-xs">👤</span>}
      </div>
      <p className="text-text-main text-sm font-semibold flex-1 text-left">{p?.nome}</p>
      {selected && <span className={cn('text-sm font-bold', checkColor)}>✓</span>}
    </button>
  )
}

function RankingCard({ emoji, title, titleColor, leaderColor, ranking }) {
  return (
    <div className="bg-card rounded-2xl p-4 space-y-2">
      <p className={cn('font-bold text-sm', titleColor)}>{emoji} {title}</p>
      {ranking.map((p, i) => (
        <div key={p.id} className="flex items-center gap-3 py-1">
          <span className="text-text-muted text-xs font-bold w-5 shrink-0">{i + 1}º</span>
          <p className={cn('text-sm font-semibold flex-1', i === 0 && p.votos > 0 ? leaderColor : 'text-text-main')}>
            {p.nome}
          </p>
          <span className="text-text-muted text-xs shrink-0">
            {p.votos} voto{p.votos !== 1 ? 's' : ''}
          </span>
        </div>
      ))}
    </div>
  )
}
