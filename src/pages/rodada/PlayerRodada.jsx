import { useAuth } from '@/hooks/useAuth'
import { useRodada } from '@/context/RodadaContext'
import { cn } from '@/lib/utils'
import TeamsGrid from './TeamsGrid'
import { CalendarDays, Trophy } from 'lucide-react'

export default function PlayerRodada() {
  const { rodada, presencas, teams, matchHistory, joinList, leaveList, confirmPayment } = useRodada()
  const { profile } = useAuth()
  const userId = profile?.id

  const lista = presencas.filter(p => p.posicao <= 20).sort((a, b) => a.posicao - b.posicao)
  const fila  = presencas.filter(p => p.posicao > 20).sort((a, b) => a.posicao - b.posicao)

  const myPresenca = presencas.find(p => p.usuario_id === userId)
  const isOnList   = myPresenca && myPresenca.posicao <= 20
  const isOnQueue  = myPresenca && myPresenca.posicao > 20
  const queuePos   = isOnQueue ? fila.findIndex(p => p.usuario_id === userId) + 1 : null

  if (!rodada) {
    return (
      <div className="min-h-full bg-background flex flex-col items-center justify-center py-20 px-4 text-center">
        <CalendarDays size={40} className="text-text-muted mb-4" />
        <p className="text-text-muted text-sm">Nenhuma rodada disponível no momento.</p>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="px-4 pt-10 pb-4">
        <h1 className="text-2xl font-black text-text-main uppercase tracking-widest">Rodada</h1>
        <p className="text-text-muted text-sm mt-0.5">Segunda · {rodada.data_jogo}</p>
      </div>

      {/* ── AGUARDANDO ── */}
      {rodada.status === 'aguardando' && (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mb-4">
            <CalendarDays size={36} className="text-text-muted" />
          </div>
          <p className="text-text-main font-semibold">Aguardando rodada...</p>
          <p className="text-text-muted text-xs mt-2 max-w-xs">
            A lista abre automaticamente na quinta-feira às 14:00.
          </p>
        </div>
      )}

      {/* ── ABERTA ── */}
      {rodada.status === 'aberta' && (
        <div className="px-4 space-y-4 pb-6">
          {/* Status do usuário */}
          {!myPresenca && (
            <div className="bg-card rounded-2xl p-5 text-center space-y-3">
              <p className="text-text-main font-semibold">
                Lista aberta! · <span className="text-primary">{20 - lista.length} vagas</span>
              </p>
              <button
                onClick={() => joinList(userId, profile)}
                className="w-full bg-primary text-black font-bold py-3 rounded-xl active:scale-95 transition-transform"
              >
                {lista.length < 20 ? 'Entrar na lista' : 'Entrar na fila de espera'}
              </button>
            </div>
          )}

          {isOnList && (
            <div className="bg-card rounded-2xl p-4 space-y-3">
              <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">Você está na lista</p>
              {myPresenca.status === 'pago' ? (
                <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 text-center">
                  <p className="text-primary font-semibold text-sm">✓ Pagamento confirmado</p>
                </div>
              ) : (
                <button
                  onClick={() => confirmPayment(userId)}
                  className="w-full bg-primary text-black font-bold py-3 rounded-xl active:scale-95 transition-transform"
                >
                  Confirmar pagamento
                </button>
              )}
              <button
                onClick={() => leaveList(userId)}
                className="w-full border border-danger/30 text-danger text-sm font-semibold py-2.5 rounded-xl active:scale-95 transition-transform"
              >
                Retirar meu nome
              </button>
            </div>
          )}

          {isOnQueue && (
            <div className="bg-card rounded-2xl p-4 text-center space-y-2">
              <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">Fila de espera</p>
              <p className="text-4xl font-black text-secondary">{queuePos}º</p>
              <p className="text-text-muted text-xs">Você será promovido automaticamente se alguém sair.</p>
              <button
                onClick={() => leaveList(userId)}
                className="w-full border border-border text-text-muted text-sm font-semibold py-2.5 rounded-xl mt-2 active:scale-95 transition-transform"
              >
                Sair da fila
              </button>
            </div>
          )}

          {/* Lista */}
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">
            Lista ({lista.length}/20)
          </p>
          {lista.map((p, i) => (
            <div key={p.id} className="bg-card rounded-2xl p-3 flex items-center gap-3">
              <span className="text-text-muted text-xs font-bold w-6 text-center shrink-0">{i + 1}</span>
              <div className="w-9 h-9 rounded-full bg-elevated flex items-center justify-center overflow-hidden shrink-0">
                {p.profiles?.foto_url
                  ? <img src={p.profiles.foto_url} alt={p.profiles.nome} className="w-full h-full object-contain" />
                  : <span className="text-sm">👤</span>}
              </div>
              <p className={cn('text-sm font-semibold flex-1 truncate', p.usuario_id === userId ? 'text-primary' : 'text-text-main')}>
                {p.profiles?.nome}
                {p.usuario_id === userId && ' (você)'}
              </p>
              <span className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0',
                p.status === 'pago' ? 'bg-primary/15 text-primary' : 'bg-secondary/15 text-secondary'
              )}>
                {p.status === 'pago' ? 'Pago' : 'Pendente'}
              </span>
            </div>
          ))}

          {fila.length > 0 && (
            <>
              <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mt-2">Fila de espera</p>
              {fila.map((p, i) => (
                <div key={p.id} className="bg-card rounded-2xl p-3 flex items-center gap-3 opacity-60">
                  <span className="text-text-muted text-xs font-bold w-6 text-center shrink-0">{i + 1}º</span>
                  <div className="w-9 h-9 rounded-full bg-elevated flex items-center justify-center shrink-0">
                    <span className="text-sm">👤</span>
                  </div>
                  <p className={cn('text-sm font-semibold flex-1 truncate', p.usuario_id === userId ? 'text-secondary' : 'text-text-main')}>
                    {p.profiles?.nome}
                    {p.usuario_id === userId && ' (você)'}
                  </p>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── SORTEADA / EM JOGO ── */}
      {(rodada.status === 'sorteada' || rodada.status === 'em_jogo') && (
        <div className="px-4 pb-6">
          {teams && <TeamsGrid teams={teams} />}
        </div>
      )}

      {/* ── ENCERRADA ── */}
      {rodada.status === 'encerrada' && (
        <PlayerRoundSummary matchHistory={matchHistory} teams={teams} />
      )}
    </div>
  )
}

function PlayerRoundSummary({ matchHistory, teams }) {
  const allEvents = matchHistory.flatMap(m => m.events ?? [])

  const goalMap = {}
  allEvents.filter(e => e.type === 'gol').forEach(e => {
    const key = e.player.id
    goalMap[key] = { player: e.player, count: (goalMap[key]?.count ?? 0) + 1 }
  })
  const artilheiro = Object.values(goalMap).sort((a, b) => b.count - a.count)[0]

  const assistMap = {}
  allEvents.filter(e => e.type === 'assistencia').forEach(e => {
    const key = e.player.id
    assistMap[key] = { player: e.player, count: (assistMap[key]?.count ?? 0) + 1 }
  })
  const garcom = Object.values(assistMap).sort((a, b) => b.count - a.count)[0]

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

  return (
    <div className="px-4 pb-8 space-y-4">
      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 text-center">
        <Trophy size={28} className="text-primary mx-auto mb-2" />
        <p className="text-primary font-black text-lg">Rodada Encerrada!</p>
        <p className="text-text-muted text-xs mt-1">{matchHistory.length} partida{matchHistory.length !== 1 ? 's' : ''} realizadas</p>
      </div>

      {(artilheiro || garcom || timeDaRodada) && (
        <>
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">Destaques</p>
          <div className="space-y-3">
            {artilheiro && (
              <div className="bg-card rounded-2xl p-4 flex items-center gap-4">
                <span className="text-2xl">⚽</span>
                <div className="flex-1 min-w-0">
                  <p className="text-text-muted text-xs">Artilheiro</p>
                  <p className="text-primary font-black truncate">{artilheiro.player.nome}</p>
                </div>
                <span className="text-text-muted text-sm">{artilheiro.count} gol{artilheiro.count > 1 ? 's' : ''}</span>
              </div>
            )}
            {garcom && (
              <div className="bg-card rounded-2xl p-4 flex items-center gap-4">
                <span className="text-2xl">🅰️</span>
                <div className="flex-1 min-w-0">
                  <p className="text-text-muted text-xs">Garçom</p>
                  <p className="text-secondary font-black truncate">{garcom.player.nome}</p>
                </div>
                <span className="text-text-muted text-sm">{garcom.count} assist.</span>
              </div>
            )}
            {timeDaRodada && (
              <div className="bg-card rounded-2xl p-4 flex items-center gap-4">
                <span className="text-2xl">🏆</span>
                <div className="flex-1 min-w-0">
                  <p className="text-text-muted text-xs">Time da Rodada</p>
                  <p className="text-secondary font-black truncate">{timeDaRodada.nome}</p>
                </div>
                <span className="text-text-muted text-sm">{timeDaRodada.vitorias} vitória{timeDaRodada.vitorias !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </>
      )}

      {teams && <TeamsGrid teams={teams} />}
    </div>
  )
}
