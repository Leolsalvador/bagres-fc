import { useState, useEffect } from 'react'
import { Star, Vote } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useVotacao } from '@/context/VotacaoContext'
import { fetchApprovedProfiles, saveVoto, fetchMyVotos } from '@/lib/api'

export default function Votacao() {
  const { profile } = useAuth()
  const { ciclo, votacaoAberta, setVotacaoAberta } = useVotacao()
  const isAdmin = profile?.papel === 'admin'

  const [players, setPlayers] = useState([])
  const [index, setIndex]     = useState(0)
  const [rating, setRating]   = useState(0)
  const [hover, setHover]     = useState(0)
  const [votos, setVotos]     = useState({}) // { playerId: rating }
  const [animKey, setAnimKey] = useState(0)
  const [loadingVotos, setLoadingVotos] = useState(false)

  // Busca jogadores aprovados e votos já dados neste ciclo
  useEffect(() => {
    if (!votacaoAberta || !profile?.id) return
    setLoadingVotos(true)
    fetchApprovedProfiles()
      .then(all => {
        const others = all.filter(p => p.id !== profile.id)
        setPlayers(others)
        if (ciclo?.id) {
          return fetchMyVotos(ciclo.id, profile.id).then(existingVotos => {
            const votoMap = {}
            existingVotos.forEach(v => { votoMap[v.avaliado_id] = v.nota })
            setVotos(votoMap)
            // Avança o index para o primeiro jogador ainda não votado
            const firstPending = others.findIndex(p => !votoMap[p.id])
            setIndex(firstPending === -1 ? others.length : firstPending)
          })
        }
      })
      .catch(console.error)
      .finally(() => setLoadingVotos(false))
  }, [votacaoAberta, profile?.id, ciclo?.id])

  const done = index >= players.length
  const current = players[index]

  function confirmVote() {
    if (rating === 0 || !ciclo?.id || !profile?.id) return
    const targetId = current.id
    setVotos(v => ({ ...v, [targetId]: rating }))
    setRating(0)
    setHover(0)
    setAnimKey(k => k + 1)
    setIndex(i => i + 1)
    saveVoto(ciclo.id, profile.id, targetId, rating).catch(console.error)
  }

  if (loadingVotos) {
    return (
      <div className="min-h-full bg-background flex items-center justify-center">
        <p className="text-text-muted text-sm">Carregando votação...</p>
      </div>
    )
  }

  if (!votacaoAberta) {
    return (
      <div className="min-h-full bg-background">
        <div className="px-4 pt-10 pb-4">
          <h1 className="text-2xl font-black text-text-main uppercase tracking-widest">Votação</h1>
          <p className="text-text-muted text-sm mt-0.5">Avalie seus colegas</p>
          {isAdmin && <AdminVoteToggle aberta={votacaoAberta} onToggle={() => setVotacaoAberta(v => !v)} />}
        </div>
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mb-4">
            <Star size={36} className="text-text-muted" />
          </div>
          <p className="text-text-main font-semibold">Votação não está aberta</p>
          <p className="text-text-muted text-xs mt-2 max-w-xs">
            O administrador abrirá a votação após o encerramento de uma rodada.
          </p>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-full bg-background">
        <div className="px-4 pt-10 pb-4">
          <h1 className="text-2xl font-black text-text-main uppercase tracking-widest">Votação</h1>
          {isAdmin && <AdminVoteToggle aberta={votacaoAberta} onToggle={() => setVotacaoAberta(v => !v)} />}
        </div>
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <span className="text-4xl">✅</span>
          </div>
          <p className="text-text-main font-black text-xl">Votação concluída!</p>
          <p className="text-text-muted text-sm mt-2 max-w-xs">
            Você avaliou {players.length} jogadores. Obrigado!
          </p>
          <div className="mt-8 w-full max-w-xs space-y-2">
            {Object.entries(votos).map(([id, r]) => {
              const p = players.find(pl => pl.id === id)
              return (
                <div key={id} className="bg-card rounded-2xl px-4 py-3 flex items-center justify-between">
                  <p className="text-text-main text-sm font-semibold">{p?.nome}</p>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={14} className={s <= r ? 'text-secondary fill-secondary' : 'text-border'} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-background flex flex-col">
      {/* Header */}
      <div className="px-4 pt-10 pb-2">
        <h1 className="text-2xl font-black text-text-main uppercase tracking-widest">Votação</h1>
        <p className="text-text-muted text-sm mt-0.5">
          {index + 1} de {players.length} jogadores
        </p>
        {isAdmin && <AdminVoteToggle aberta={votacaoAberta} onToggle={() => setVotacaoAberta(v => !v)} />}
      </div>

      {/* Barra de progresso */}
      <div className="mx-4 mt-2 mb-4 h-1.5 bg-card rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${(index / players.length) * 100}%` }}
        />
      </div>

      {/* Card do jogador */}
      <div key={animKey} className="mx-4 bg-card rounded-3xl p-6 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Avatar */}
        <div className="w-28 h-28 rounded-full bg-elevated flex items-center justify-center overflow-hidden mb-4 ring-2 ring-border">
          {current.foto_url
            ? <img src={current.foto_url} alt={current.nome} className="w-full h-full object-contain" />
            : <span className="text-6xl">👤</span>}
        </div>

        {/* Nome */}
        <p className="text-text-main font-black text-2xl text-center">{current.nome}</p>

        {/* Stats */}
        <div className="flex gap-4 mt-3">
          <StatBadge label="Gols"    value={current.gols} />
          <StatBadge label="Assist." value={current.assistencias} />
          <StatBadge label="Jogos"   value={current.jogos} />
        </div>

        {/* Rating atual */}
        <div className="flex items-center gap-1 mt-3">
          <Star size={14} className="text-secondary fill-secondary" />
          <span className="text-text-muted text-sm font-semibold">{current.rating.toFixed(1)} rating atual</span>
        </div>
      </div>

      {/* Estrelas */}
      <div className="flex flex-col items-center mt-6 px-4">
        <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-4">
          {rating === 0 ? 'Toque para avaliar' : RATING_LABEL[rating]}
        </p>
        <div className="flex gap-3">
          {[1, 2, 3, 4, 5].map(s => (
            <button
              key={s}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(s)}
              className="active:scale-90 transition-transform"
            >
              <Star
                size={40}
                className={cn(
                  'transition-colors',
                  s <= (hover || rating) ? 'text-secondary fill-secondary' : 'text-border'
                )}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Botão confirmar */}
      <div className="px-4 mt-6 pb-6">
        <button
          onClick={confirmVote}
          disabled={rating === 0}
          className="w-full bg-primary text-black font-bold py-4 rounded-2xl disabled:opacity-30 active:scale-95 transition-transform"
        >
          {index < players.length - 1 ? 'Confirmar e próximo →' : 'Confirmar e finalizar ✓'}
        </button>
      </div>
    </div>
  )
}

const RATING_LABEL = {
  1: '⭐ Ruim',
  2: '⭐⭐ Regular',
  3: '⭐⭐⭐ Bom',
  4: '⭐⭐⭐⭐ Ótimo',
  5: '⭐⭐⭐⭐⭐ Excepcional',
}

function AdminVoteToggle({ aberta, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm active:scale-95 transition-transform',
        aberta
          ? 'bg-danger/10 text-danger border border-danger/20'
          : 'bg-primary text-black'
      )}
    >
      <Vote size={14} />
      {aberta ? 'Fechar votação' : 'Abrir votação'}
    </button>
  )
}

function StatBadge({ label, value }) {
  return (
    <div className="bg-elevated rounded-xl px-3 py-1.5 text-center">
      <p className="text-text-main font-black text-lg leading-none">{value}</p>
      <p className="text-text-muted text-[10px] mt-0.5">{label}</p>
    </div>
  )
}
