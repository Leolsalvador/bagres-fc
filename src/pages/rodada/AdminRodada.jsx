import { useState } from 'react'
import { Check, X, Trash2, Shuffle, Play, LogIn, XCircle, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRodada } from '@/context/RodadaContext'
import { useAuth } from '@/hooks/useAuth'
import { USE_MOCK } from '@/lib/mockData'
import TeamsGrid from './TeamsGrid'
import MatchSelector from './MatchSelector'
import MatchScreen from './MatchScreen'

const DEV_STATES = ['aguardando', 'aberta', 'sorteada', 'em_jogo', 'encerrada']

const STATUS_LABEL = {
  aguardando: 'Aguardando abertura',
  aberta:     'Lista aberta',
  sorteada:   'Times sorteados',
  em_jogo:    'Em andamento',
  encerrada:  'Encerrada',
}

const STATUS_COLOR = {
  aguardando: 'bg-border       text-text-muted',
  aberta:     'bg-primary/20   text-primary',
  sorteada:   'bg-secondary/20 text-secondary',
  em_jogo:    'bg-primary/20   text-primary',
  encerrada:  'bg-border       text-text-muted',
}


export default function AdminRodada() {
  const {
    rodada, presencas, teams, matchHistory, loading,
    setStatus, closeList, setTeams, setMatchHistory,
    validatePayment, rejectPayment, removeFromList,
    joinList, leaveList,
    performDraw, addMatchResult, createNovaRodada,
  } = useRodada()
  const { profile } = useAuth()

  const [currentMatch, setCurrentMatch]   = useState(null)
  const [waitingQueue, setWaitingQueue]   = useState([0, 1, 2, 3])
  const [onFieldWinner, setOnFieldWinner] = useState(null)

  const lista     = presencas.filter(p => p.posicao <= 20).sort((a, b) => a.posicao - b.posicao)
  const fila      = presencas.filter(p => p.posicao > 20 && p.posicao < 100).sort((a, b) => a.posicao - b.posicao)
  const goleiros  = presencas.filter(p => p.posicao >= 100).sort((a, b) => a.posicao - b.posicao)
  const pagos     = lista.filter(p => p.status === 'pago').length

  function handleDraw() {
    setCurrentMatch(null)
    setMatchHistory([])
    setWaitingQueue([0, 1, 2, 3])
    setOnFieldWinner(null)
    performDraw()
  }

  function handleSelectMatch(match) {
    const aIdx = teams.findIndex(t => t.nome === match.teamA.nome)
    const bIdx = teams.findIndex(t => t.nome === match.teamB.nome)
    setWaitingQueue(q => q.filter(i => i !== aIdx && i !== bIdx))
    setOnFieldWinner(null)
    setCurrentMatch(match)
  }

  function handleEndMatch(result) {
    addMatchResult(result)
    const aIdx = teams.findIndex(t => t.nome === result.teamA.nome)
    const bIdx = teams.findIndex(t => t.nome === result.teamB.nome)

    if (result.winner === 'draw') {
      setOnFieldWinner(null)
      // Os dois que estavam esperando entram automaticamente
      const nextAIdx = waitingQueue[0]
      const nextBIdx = waitingQueue[1]
      // Fila: remove os dois que vão jogar, adiciona os que empataram no final
      setWaitingQueue(q => [...q.slice(2), aIdx, bIdx])
      if (nextAIdx != null && nextBIdx != null) {
        setCurrentMatch({ teamA: teams[nextAIdx], teamB: teams[nextBIdx], autoStart: true })
      } else {
        setCurrentMatch(null)
      }
    } else {
      const winnerIdx = result.winner === 'A' ? aIdx : bIdx
      const loserIdx  = result.winner === 'A' ? bIdx : aIdx
      setOnFieldWinner(winnerIdx)
      setWaitingQueue(q => [...q, loserIdx])
      setCurrentMatch(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-full bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!rodada) {
    return (
      <div className="min-h-full bg-background flex flex-col items-center justify-center py-20 px-4 text-center">
        <h1 className="text-2xl font-black text-text-main uppercase tracking-widest mb-6">Rodada</h1>
        <p className="text-text-muted text-sm mb-6">Nenhuma rodada criada ainda.</p>
        <button onClick={createNovaRodada} className="bg-primary text-black font-bold px-8 py-3 rounded-xl active:scale-95 transition-transform">
          Criar primeira rodada
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="px-4 pt-10 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-text-main uppercase tracking-widest">Rodada</h1>
            <p className="text-text-muted text-sm mt-0.5">Segunda · {rodada.data_jogo}</p>
          </div>
          <span className={cn('text-xs font-bold px-3 py-1 rounded-full', STATUS_COLOR[rodada.status])}>
            {STATUS_LABEL[rodada.status]}
          </span>
        </div>

        {USE_MOCK && (
          <button
            onClick={() => {
              const idx = DEV_STATES.indexOf(rodada.status)
              setStatus(DEV_STATES[(idx + 1) % DEV_STATES.length])
            }}
            className="flex items-center gap-1 bg-secondary/20 text-secondary text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
          >
            [DEV] <ChevronRight size={12} />
          </button>
        )}
      </div>

      {/* ── AGUARDANDO ── */}
      {rodada.status === 'aguardando' && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <p className="text-text-muted mb-6 text-sm max-w-xs">
            A lista abre automaticamente na quinta às 14:00, ou você pode abrir manualmente.
          </p>
          <button
            onClick={() => setStatus('aberta')}
            className="bg-primary text-black font-bold px-8 py-3 rounded-xl active:scale-95 transition-transform"
          >
            Abrir lista agora
          </button>
        </div>
      )}

      {/* ── ABERTA ── */}
      {rodada.status === 'aberta' && (
        <div className="px-4 space-y-4 pb-6">
          {/* Ações do admin */}
          <div className="flex gap-3">
            {!presencas.some(p => p.usuario_id === profile?.id) ? (
              <button
                onClick={() => joinList(profile.id, profile)}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-black font-bold py-3 rounded-xl active:scale-95 transition-transform text-sm"
              >
                <LogIn size={15} /> Entrar na lista
              </button>
            ) : (
              <button
                onClick={() => leaveList(profile.id)}
                className="flex-1 flex items-center justify-center gap-2 border border-border text-text-muted py-3 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
              >
                <X size={15} /> Sair da lista
              </button>
            )}
            <button
              onClick={closeList}
              className="flex-1 flex items-center justify-center gap-2 border border-danger/40 text-danger py-3 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
            >
              <XCircle size={15} /> Fechar lista
            </button>
          </div>

          {/* Resumo */}
          <div className="bg-card rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-text-main font-bold text-lg">{lista.length}<span className="text-text-muted font-normal text-sm">/20</span></p>
              <p className="text-text-muted text-xs">na lista</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-primary font-bold text-lg">{pagos}</p>
              <p className="text-text-muted text-xs">pagaram</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-text-muted font-bold text-lg">{fila.length}</p>
              <p className="text-text-muted text-xs">na fila</p>
            </div>
          </div>

          {/* Lista principal */}
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">
            Lista principal ({lista.length}/20)
          </p>
          {lista.map((p, i) => (
            <PlayerRow
              key={p.id}
              presenca={p}
              position={i + 1}
              onValidate={() => validatePayment(p.id)}
              onReject={() => rejectPayment(p.id)}
              onRemove={() => removeFromList(p.id)}
            />
          ))}

          {/* Fila de espera */}
          {fila.length > 0 && (
            <>
              <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mt-2">
                Fila de espera
              </p>
              {fila.map((p, i) => (
                <PlayerRow
                  key={p.id}
                  presenca={p}
                  position={`${i + 1}º fila`}
                  isQueue
                  onRemove={() => removeFromList(p.id)}
                />
              ))}
            </>
          )}

          {/* Goleiros */}
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mt-2">
            Goleiros ({goleiros.length})
          </p>
          {goleiros.length === 0 && (
            <p className="text-text-muted text-xs text-center py-2">Nenhum goleiro confirmado.</p>
          )}
          {goleiros.map((p, i) => (
            <PlayerRow
              key={p.id}
              presenca={p}
              position={i + 1}
              isGol
              onRemove={() => removeFromList(p.id)}
            />
          ))}

          {/* Botão sortear */}
          <button
            onClick={handleDraw}
            disabled={lista.length < 20}
            className="w-full flex items-center justify-center gap-2 bg-primary text-black font-bold py-4 rounded-2xl disabled:opacity-40 active:scale-95 transition-transform mt-2"
          >
            <Shuffle size={18} />
            {lista.length < 20 ? `Sortear (faltam ${20 - lista.length})` : 'Sortear Times'}
          </button>
        </div>
      )}

      {/* ── SORTEADA ── */}
      {rodada.status === 'sorteada' && (
        <div className="px-4 pb-6 space-y-4">
          {teams
            ? <TeamsGrid teams={teams} />
            : <p className="text-text-muted text-center py-8 text-sm">Nenhum sorteio realizado.</p>
          }
          <div className="flex gap-3">
            <button
              onClick={handleDraw}
              className="flex-1 flex items-center justify-center gap-2 border border-border text-text-muted py-3 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
            >
              <Shuffle size={15} /> Ressortear
            </button>
            <button
              onClick={() => setStatus('em_jogo')}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-black font-bold py-3 rounded-xl active:scale-95 transition-transform"
            >
              <Play size={15} /> Iniciar jogos
            </button>
          </div>
        </div>
      )}

      {/* ── EM JOGO ── */}
      {rodada.status === 'em_jogo' && teams && (
        currentMatch
          ? <MatchScreen
              key={`${currentMatch.teamA.nome}-${currentMatch.teamB.nome}`}
              match={currentMatch}
              teamAIndex={teams.findIndex(t => t.nome === currentMatch.teamA.nome)}
              teamBIndex={teams.findIndex(t => t.nome === currentMatch.teamB.nome)}
              isFirstMatch={matchHistory.length === 0}
              onEnd={handleEndMatch}
              onBack={() => setCurrentMatch(null)}
            />
          : <MatchSelector
              teams={teams}
              matches={matchHistory}
              onSelect={handleSelectMatch}
              onEndRound={() => setStatus('encerrada')}
              suggestedIdxA={onFieldWinner}
              suggestedIdxB={waitingQueue[0] ?? null}
              waitingQueue={waitingQueue}
              onFieldWinner={onFieldWinner}
            />
      )}

      {/* ── ENCERRADA ── */}
      {rodada.status === 'encerrada' && (
        <div>
          <div className="px-4 mb-2">
            <button
              onClick={createNovaRodada}
              className="w-full bg-primary text-black font-bold py-3 rounded-2xl active:scale-95 transition-transform text-sm"
            >
              + Nova Rodada
            </button>
          </div>
          <RoundSummary matchHistory={matchHistory} />
        </div>
      )}
    </div>
  )
}

const POSICAO_COLOR = {
  ATA: 'bg-red-500/20 text-red-400',
  MEI: 'bg-blue-500/20 text-blue-400',
  ZAG: 'bg-yellow-500/20 text-yellow-400',
  GOL: 'bg-purple-500/20 text-purple-400',
  CORINGA: 'bg-primary/20 text-primary',
}

function PlayerRow({ presenca, position, isQueue = false, isGol = false, onValidate, onReject, onRemove }) {
  const { profiles: p, status } = presenca

  return (
    <div className="bg-card rounded-2xl p-3">
      <div className="flex items-center gap-3">
        {/* Posição */}
        <span className="text-text-muted text-xs font-bold w-7 text-center shrink-0">
          {position}
        </span>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-elevated flex items-center justify-center overflow-hidden shrink-0">
          {p?.foto_url
            ? <img src={p.foto_url} alt={p.nome} className="w-full h-full object-contain" />
            : <span className="text-sm">👤</span>}
        </div>

        {/* Nome */}
        <p className="text-text-main text-sm font-semibold flex-1 truncate">{p?.nome}</p>

        {/* Badge posição */}
        {p?.posicao_campo && (
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0', POSICAO_COLOR[p.posicao_campo])}>
            {p.posicao_campo}
          </span>
        )}

        {/* Status badge */}
        {!isQueue && !isGol && (
          <span className={cn(
            'text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0',
            status === 'pago'
              ? 'bg-primary/15 text-primary'
              : 'bg-secondary/15 text-secondary'
          )}>
            {status === 'pago' ? 'Pago' : 'Pendente'}
          </span>
        )}
      </div>

      {/* Ações */}
      <div className="flex gap-2 mt-2 ml-10">
        {!isQueue && status !== 'pago' && (
          <ActionBtn onClick={onValidate} color="green" icon={<Check size={13} />} label="Validar pagamento" />
        )}
        {!isQueue && status === 'pago' && (
          <ActionBtn onClick={onReject} color="yellow" icon={<X size={13} />} label="Rejeitar pagamento" />
        )}
        <ActionBtn onClick={onRemove} color="red" icon={<Trash2 size={13} />} label="Remover" />
      </div>
    </div>
  )
}

function ActionBtn({ onClick, color, icon, label }) {
  const colors = {
    green:  'bg-primary/10  text-primary',
    red:    'bg-danger/10   text-danger',
    yellow: 'bg-secondary/10 text-secondary',
  }
  return (
    <button
      onClick={onClick}
      className={cn('flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold active:scale-95 transition-transform', colors[color])}
    >
      {icon}{label}
    </button>
  )
}

// ── Resumo da Rodada ─────────────────────────────────────────
function RoundSummary({ matchHistory }) {
  const allEvents = matchHistory.flatMap(m => m.events ?? [])

  // Artilheiro
  const goalMap = {}
  allEvents.filter(e => e.type === 'gol').forEach(e => {
    const key = e.player.id
    goalMap[key] = { player: e.player, count: (goalMap[key]?.count ?? 0) + 1 }
  })
  const artilheiro = Object.values(goalMap).sort((a, b) => b.count - a.count)[0]

  // Garçom
  const assistMap = {}
  allEvents.filter(e => e.type === 'assistencia').forEach(e => {
    const key = e.player.id
    assistMap[key] = { player: e.player, count: (assistMap[key]?.count ?? 0) + 1 }
  })
  const garcom = Object.values(assistMap).sort((a, b) => b.count - a.count)[0]

  // Time da Rodada (mais vitórias; desempate: saldo de gols)
  const teamMap = {}
  matchHistory.forEach(m => {
    const tA = m.teamA.nome, tB = m.teamB.nome
    if (!teamMap[tA]) teamMap[tA] = { nome: tA, vitorias: 0, saldo: 0 }
    if (!teamMap[tB]) teamMap[tB] = { nome: tB, vitorias: 0, saldo: 0 }
    teamMap[tA].saldo += (m.goalsA - m.goalsB)
    teamMap[tB].saldo += (m.goalsB - m.goalsA)
    if (m.winner === 'A') teamMap[tA].vitorias++
    else if (m.winner === 'B') teamMap[tB].vitorias++
  })
  const timeDaRodada = Object.values(teamMap).sort((a, b) =>
    b.vitorias - a.vitorias || b.saldo - a.saldo
  )[0]

  const totalGols = allEvents.filter(e => e.type === 'gol').length

  return (
    <div className="px-4 pb-8 space-y-4">
      {/* Banner */}
      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 text-center">
        <p className="text-primary font-black text-lg">Rodada Encerrada ✓</p>
        <p className="text-text-muted text-xs mt-1">
          {matchHistory.length} partida{matchHistory.length !== 1 ? 's' : ''} · {totalGols} gols
        </p>
      </div>

      {/* Destaques */}
      <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">Destaques</p>

      <div className="space-y-3">
        {artilheiro && (
          <DestaquCard
            emoji="⚽"
            label="Artilheiro"
            nome={artilheiro.player.nome}
            detalhe={`${artilheiro.count} gol${artilheiro.count > 1 ? 's' : ''}`}
            color="text-primary"
          />
        )}
        {garcom && (
          <DestaquCard
            emoji="🅰️"
            label="Garçom"
            nome={garcom.player.nome}
            detalhe={`${garcom.count} assist.`}
            color="text-secondary"
          />
        )}
        {timeDaRodada && (
          <DestaquCard
            emoji="🏆"
            label="Time da Rodada"
            nome={timeDaRodada.nome}
            detalhe={`${timeDaRodada.vitorias} vitória${timeDaRodada.vitorias !== 1 ? 's' : ''}`}
            color="text-secondary"
          />
        )}
        {!artilheiro && !garcom && !timeDaRodada && (
          <p className="text-text-muted text-sm text-center py-4">Nenhuma partida registrada.</p>
        )}
      </div>

      {/* Partidas */}
      {matchHistory.length > 0 && (
        <>
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">Partidas</p>
          {matchHistory.map((m, i) => (
            <div key={i} className="bg-card rounded-2xl px-4 py-3 flex items-center justify-between">
              <p className="text-text-main text-sm font-semibold flex-1 truncate">{m.teamA.nome}</p>
              <div className="flex items-center gap-2 shrink-0 mx-2">
                <span className="text-text-main font-black">{m.goalsA}</span>
                <span className="text-text-muted text-xs">×</span>
                <span className="text-text-main font-black">{m.goalsB}</span>
              </div>
              <p className="text-text-main text-sm font-semibold flex-1 truncate text-right">{m.teamB.nome}</p>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

function DestaquCard({ emoji, label, nome, detalhe, color }) {
  return (
    <div className="bg-card rounded-2xl p-4 flex items-center gap-4">
      <span className="text-2xl shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">{label}</p>
        <p className={cn('font-black text-base truncate', color)}>{nome}</p>
      </div>
      <span className="text-text-muted text-sm font-semibold shrink-0">{detalhe}</span>
    </div>
  )
}
