import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Star, User, Check, Trophy, Play, Pause, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useCampeonato } from '@/context/CampeonatoContext'
import { USE_MOCK } from '@/lib/mockData'

function formatTime(s) {
  if (s === null || s === undefined) return '--:--'
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export default function VotacaoMVP() {
  const { partidaId } = useParams()
  const { user, isAdmin } = useAuth()
  const { partidas, times, jogadores, eventos, refresh, updatePartidaLocal } = useCampeonato()
  const navigate = useNavigate()

  const [votos, setVotos] = useState([])
  const [meuVoto, setMeuVoto] = useState(null)
  const [loading, setLoading] = useState(!USE_MOCK)
  const [salvando, setSalvando] = useState(false)

  const partida = partidas.find(p => p.id === partidaId)
  const timeCasa = times.find(t => t.id === partida?.time_casa_id) ?? partida?.time_casa
  const timeVisitante = times.find(t => t.id === partida?.time_visitante_id) ?? partida?.time_visitante
  const jogadoresCasa = jogadores.filter(j => j.time_id === partida?.time_casa_id)
  const jogadoresVisitante = jogadores.filter(j => j.time_id === partida?.time_visitante_id)
  const eventosPartida = eventos.filter(e => e.partida_id === partidaId)

  // Admin always controls the match from the control screen — redirect if the match is still live
  useEffect(() => {
    if (isAdmin && partida?.status === 'em_andamento') {
      navigate('/admin/campeonato/controle', { replace: true })
    }
  }, [isAdmin, partida?.status]) // eslint-disable-line

  useEffect(() => {
    if (!partidaId || USE_MOCK) { setLoading(false); return }
    loadVotos()
    const channel = supabase
      .channel(`mvp-${partidaId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'campeonato_votos_mvp', filter: `partida_id=eq.${partidaId}` }, () => loadVotos())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [partidaId])

  async function loadVotos() {
    const [{ data: v }, { data: meu }] = await Promise.all([
      supabase.from('campeonato_votos_mvp').select('jogador_id').eq('partida_id', partidaId),
      supabase.from('campeonato_votos_mvp').select('jogador_id').eq('partida_id', partidaId).eq('votante_id', user.id).maybeSingle(),
    ])
    setVotos(v ?? [])
    setMeuVoto(meu?.jogador_id ?? null)
    setLoading(false)
  }

  async function votar(jogadorId) {
    if (salvando || !partida?.votacao_mvp_aberta) return
    setSalvando(true)

    if (meuVoto === jogadorId) {
      // Deselect
      if (!USE_MOCK) {
        await supabase.from('campeonato_votos_mvp')
          .delete()
          .eq('partida_id', partidaId)
          .eq('votante_id', user.id)
      }
      setMeuVoto(null)
      setVotos(v => { const i = v.findIndex(vt => vt.jogador_id === jogadorId); return i >= 0 ? [...v.slice(0, i), ...v.slice(i + 1)] : v })
    } else {
      if (!USE_MOCK) {
        const { error } = await supabase.from('campeonato_votos_mvp')
          .upsert(
            { partida_id: partidaId, votante_id: user.id, jogador_id: jogadorId },
            { onConflict: 'partida_id,votante_id' }
          )
        if (!error) setMeuVoto(jogadorId)
      } else {
        setMeuVoto(jogadorId)
        setVotos(v => [...v.filter(vt => vt.jogador_id !== meuVoto), { jogador_id: jogadorId }])
      }
    }

    setSalvando(false)
    if (!USE_MOCK) loadVotos()
  }

  async function fecharVotacao() {
    if (!partida) return
    const contagem = {}
    votos.forEach(v => { contagem[v.jogador_id] = (contagem[v.jogador_id] ?? 0) + 1 })
    const mvpId = Object.entries(contagem).sort((a, b) => b[1] - a[1])[0]?.[0]

    const updates = { votacao_mvp_aberta: false, mvp_id: mvpId ?? null }
    if (!USE_MOCK) {
      await supabase.from('campeonato_partidas').update(updates).eq('id', partidaId)
      refresh()
    } else {
      updatePartidaLocal(partidaId, updates)
    }
    navigate('/admin/campeonato/controle')
  }

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!partida) {
    return (
      <div className="min-h-full flex items-center justify-center text-text-muted text-sm">
        Partida não encontrada.
      </div>
    )
  }

  // ── Live match view (spectators + admin while match is running) ──
  if (partida.status === 'em_andamento') {
    return (
      <LiveMatchView
        partida={partida}
        timeCasa={timeCasa}
        timeVisitante={timeVisitante}
        jogadoresCasa={jogadoresCasa}
        jogadoresVisitante={jogadoresVisitante}
        eventosPartida={eventosPartida}
      />
    )
  }

  // ── Waiting (match ended but voting not open) ──
  if (partida.status === 'encerrada' && !partida.votacao_mvp_aberta && !partida.mvp_id) {
    return (
      <div className="min-h-full bg-background flex flex-col">
        <div className="px-4 pt-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted text-sm mb-2">
            <ArrowLeft size={16} /> Voltar
          </button>
        </div>
        <MatchHeader partida={partida} timeCasa={timeCasa} timeVisitante={timeVisitante} subtitle="Partida encerrada" />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-text-muted px-8">
          <Star size={36} className="opacity-20" />
          <p className="text-sm text-center">Aguardando abertura da votação...</p>
        </div>
      </div>
    )
  }

  // ── Voting / reveal ──
  const votacaoAberta = partida.votacao_mvp_aberta
  const contagemVotos = {}
  votos.forEach(v => { contagemVotos[v.jogador_id] = (contagemVotos[v.jogador_id] ?? 0) + 1 })
  const totalVotos = votos.length
  const mvpId = Object.entries(contagemVotos).sort((a, b) => b[1] - a[1])[0]?.[0]

  const meusEventos = eventosPartida.filter(e => e.jogador_id === user?.id)
  const meusGols = meusEventos.filter(e => e.tipo === 'gol').length
  const minhasAssists = meusEventos.filter(e => e.tipo === 'assistencia').length
  const cartaoAmarelo = meusEventos.filter(e => e.tipo === 'cartao_amarelo').length
  const cartaoVermelho = meusEventos.some(e => e.tipo === 'cartao_vermelho')
  const temEventos = meusGols > 0 || minhasAssists > 0 || cartaoAmarelo > 0 || cartaoVermelho

  return (
    <div className="min-h-full bg-background">
      <div className="px-4 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted text-sm mb-4">
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="flex items-center gap-2 mb-1">
          <Star size={16} className="text-secondary" />
          <span className="text-xs font-semibold text-text-muted uppercase tracking-widest">MVP da Partida</span>
        </div>
        <div className="flex items-center justify-center gap-3 mt-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: timeCasa?.cor }} />
            <span className="text-sm font-bold text-text-main">{timeCasa?.nome}</span>
          </div>
          <span className="text-text-muted font-black">
            {partida.gols_casa} – {partida.gols_visitante}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: timeVisitante?.cor }} />
            <span className="text-sm font-bold text-text-main">{timeVisitante?.nome}</span>
          </div>
        </div>
        <p className="text-center text-xs text-text-muted mt-2">
          {votacaoAberta ? 'Vote no melhor jogador da partida' : 'Votação encerrada'}
        </p>
      </div>

      {/* MVP revelado */}
      {!votacaoAberta && partida.mvp && (
        <div className="mx-4 mb-4 bg-secondary/10 rounded-2xl p-5 flex flex-col items-center gap-3 border border-secondary/30">
          <Trophy size={28} className="text-secondary" />
          <div className="w-16 h-16 rounded-full overflow-hidden bg-elevated flex items-center justify-center">
            {partida.mvp.foto_url
              ? <img src={partida.mvp.foto_url} alt={partida.mvp.nome} className="w-full h-full object-contain" />
              : <User size={24} className="text-text-muted" />}
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-text-main">{partida.mvp.nome}</p>
            <p className="text-secondary text-xs font-semibold">MVP da Partida ⭐</p>
          </div>
          <p className="text-xs text-text-muted">{totalVotos} voto{totalVotos !== 1 ? 's' : ''}</p>
        </div>
      )}

      {/* Eventos da partida */}
      {eventosPartida.length > 0 && (
        <div className="mx-4 mb-4 bg-card rounded-2xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Eventos</span>
          </div>
          <div className="divide-y divide-border/50">
            {[...eventosPartida]
              .sort((a, b) => (a.minuto ?? 0) - (b.minuto ?? 0))
              .map((ev, i) => {
                const icon = ev.tipo === 'gol' ? '⚽' : ev.tipo === 'assistencia' ? '🅰️' : ev.tipo === 'cartao_amarelo' ? '🟨' : '🟥'
                const label = ev.tipo === 'gol' ? 'Gol' : ev.tipo === 'assistencia' ? 'Assistência' : ev.tipo === 'cartao_amarelo' ? 'Cartão Amarelo' : 'Cartão Vermelho'
                const nome = ev.profiles?.nome ?? ev.nome ?? '—'
                const teamCor = ev.campeonato_times?.cor
                return (
                  <div key={i} className="px-4 py-2.5 flex items-center gap-3">
                    <span className="text-base w-6 text-center shrink-0">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-text-main">{nome}</span>
                      {teamCor && <span className="ml-2 inline-block w-2 h-2 rounded-full align-middle" style={{ background: teamCor }} />}
                    </div>
                    <span className="text-xs text-text-muted shrink-0">{ev.minuto != null ? `${ev.minuto}'` : label}</span>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Minha partida */}
      <div className="mx-4 mb-4 bg-card rounded-2xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Minha Partida</span>
          {mvpId === user?.id && !votacaoAberta && (
            <span className="ml-auto text-[10px] font-bold text-secondary uppercase tracking-wider">⭐ MVP</span>
          )}
        </div>
        {temEventos ? (
          <div className="px-4 py-3 flex items-center gap-4 flex-wrap">
            {meusGols > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-lg">⚽</span>
                <span className="text-text-main font-black text-base">{meusGols}</span>
                <span className="text-text-muted text-xs">gol{meusGols !== 1 ? 's' : ''}</span>
              </div>
            )}
            {minhasAssists > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-lg">🅰️</span>
                <span className="text-text-main font-black text-base">{minhasAssists}</span>
                <span className="text-text-muted text-xs">assist{minhasAssists !== 1 ? 's' : '.'}</span>
              </div>
            )}
            {cartaoAmarelo > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-lg">🟨</span>
                <span className="text-text-main font-black text-base">{cartaoAmarelo}</span>
              </div>
            )}
            {cartaoVermelho && (
              <div className="flex items-center gap-1.5">
                <span className="text-lg">🟥</span>
              </div>
            )}
          </div>
        ) : (
          <p className="px-4 py-3 text-sm text-text-muted">Nenhum evento registrado para você nesta partida.</p>
        )}
      </div>

      {/* Jogadores */}
      <div className="px-4 pb-8 space-y-2">
        {[{ time: timeCasa, jogadores: jogadoresCasa }, { time: timeVisitante, jogadores: jogadoresVisitante }].map(({ time, jogadores: jgs }) => (
          <div key={time?.id} className="bg-card rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: time?.cor }} />
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{time?.nome}</span>
            </div>
            <div className="divide-y divide-border/50">
              {jgs.map(j => {
                const qtd = contagemVotos[j.id] ?? 0
                const percent = totalVotos > 0 ? (qtd / totalVotos) * 100 : 0
                const isMeuVoto = meuVoto === j.id
                const isMVP = mvpId === j.id && !votacaoAberta

                return (
                  <button
                    key={j.id}
                    onClick={() => votar(j.id)}
                    disabled={!votacaoAberta || salvando}
                    className={cn(
                      'w-full px-4 py-3 flex items-center gap-3 relative overflow-hidden transition-colors',
                      isMeuVoto ? 'bg-primary/10' : 'active:bg-white/5',
                      isMVP ? 'bg-secondary/10' : ''
                    )}
                  >
                    {(meuVoto || !votacaoAberta) && (
                      <span
                        className={cn('absolute left-0 top-0 bottom-0 transition-all', isMeuVoto ? 'bg-primary/15' : isMVP ? 'bg-secondary/10' : 'bg-white/5')}
                        style={{ width: `${percent}%` }}
                      />
                    )}
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-elevated flex items-center justify-center shrink-0 z-10">
                      {j.foto_url ? <img src={j.foto_url} alt={j.nome} className="w-full h-full object-contain" /> : <User size={16} className="text-text-muted" />}
                    </div>
                    <span className={cn('text-sm font-semibold flex-1 text-left z-10', isMeuVoto || isMVP ? 'text-text-main' : 'text-text-muted')}>{j.nome}</span>
                    {isMeuVoto && <Check size={16} className="text-primary z-10 shrink-0" />}
                    {isMVP && !votacaoAberta && <Trophy size={16} className="text-secondary z-10 shrink-0" />}
                    {(meuVoto || !votacaoAberta) && (
                      <span className="text-xs font-bold text-text-muted z-10 w-8 text-right">{qtd > 0 ? `${Math.round(percent)}%` : ''}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        <p className="text-center text-xs text-text-muted pt-2">
          {totalVotos} voto{totalVotos !== 1 ? 's' : ''} registrado{totalVotos !== 1 ? 's' : ''}
        </p>

        {/* Admin: fechar votação */}
        {isAdmin && votacaoAberta && (
          <button
            onClick={fecharVotacao}
            className="w-full py-3 mt-2 bg-secondary/10 text-secondary rounded-xl font-bold text-sm active:scale-95 transition-transform"
          >
            Encerrar Votação e Revelar MVP
          </button>
        )}

        {/* Admin: próxima partida (após votação encerrada) */}
        {isAdmin && !votacaoAberta && partida.status === 'encerrada' && (
          <button
            onClick={() => navigate('/admin/campeonato/controle')}
            className="w-full py-3 mt-2 bg-primary text-black rounded-xl font-bold text-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <Play size={15} /> Próxima Partida
          </button>
        )}
      </div>
    </div>
  )
}

// ── Live match view (read-only for non-admin) ─────────────────
function LiveMatchView({ partida, timeCasa, timeVisitante, jogadoresCasa, jogadoresVisitante, eventosPartida }) {
  const [liveSeconds, setLiveSeconds] = useState(null)
  const [liveEndTs, setLiveEndTs] = useState(partida.timer_end_ts)
  const [livePausedSecs, setLivePausedSecs] = useState(partida.timer_paused_secs)
  const intervalRef = useRef(null)

  // Fetch fresh data on mount so we don't rely on potentially stale context
  useEffect(() => {
    if (USE_MOCK || !partida.id) return
    supabase.from('campeonato_partidas')
      .select('timer_end_ts, timer_paused_secs')
      .eq('id', partida.id)
      .single()
      .then(({ data }) => {
        if (!data) return
        setLiveEndTs(data.timer_end_ts)
        setLivePausedSecs(data.timer_paused_secs)
      })
  }, [partida.id]) // eslint-disable-line

  // Keep live state in sync when context updates via realtime
  useEffect(() => { setLiveEndTs(partida.timer_end_ts) }, [partida.timer_end_ts])
  useEffect(() => { setLivePausedSecs(partida.timer_paused_secs) }, [partida.timer_paused_secs])

  // Sync timer from DB values
  useEffect(() => {
    clearInterval(intervalRef.current)

    if (liveEndTs) {
      const endTs = new Date(liveEndTs).getTime()
      const initial = Math.max(0, Math.round((endTs - Date.now()) / 1000))
      setLiveSeconds(initial)
      if (initial > 0) {
        intervalRef.current = setInterval(() => {
          const r = Math.max(0, Math.round((endTs - Date.now()) / 1000))
          setLiveSeconds(r)
          if (r <= 0) clearInterval(intervalRef.current)
        }, 60000)
      }
    } else if (livePausedSecs != null) {
      setLiveSeconds(livePausedSecs)
    } else {
      setLiveSeconds(null)
    }

    return () => clearInterval(intervalRef.current)
  }, [liveEndTs, livePausedSecs])

  const isTimerRunning = !!liveEndTs && liveSeconds > 0
  const half = partida.half_atual

  const golEvents = eventosPartida.filter(e => e.tipo === 'gol')
  const recentEvents = [...eventosPartida]
    .sort((a, b) => (b.minuto ?? 0) - (a.minuto ?? 0))
    .slice(0, 6)

  return (
    <div className="min-h-full bg-background flex flex-col">
      {/* AO VIVO badge */}
      <div className="px-4 pt-8 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
          <span className="text-[10px] font-black text-danger uppercase tracking-widest">Ao Vivo</span>
          {half > 0 && (
            <span className="text-[10px] font-semibold text-text-muted uppercase ml-1">
              — {half === 1 ? '1° Tempo' : '2° Tempo'}
            </span>
          )}
        </div>

        {/* Score */}
        <div className="flex items-center justify-between">
          <p className="font-black text-sm uppercase truncate max-w-[90px]" style={{ color: timeCasa?.cor ?? '#9CA3AF' }}>
            {timeCasa?.nome ?? '—'}
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-text-main font-black text-4xl">{partida.gols_casa}</span>
            <span className="text-text-muted text-lg">×</span>
            <span className="text-text-main font-black text-4xl">{partida.gols_visitante}</span>
          </div>
          <p className="font-black text-sm uppercase truncate max-w-[90px] text-right" style={{ color: timeVisitante?.cor ?? '#9CA3AF' }}>
            {timeVisitante?.nome ?? '—'}
          </p>
        </div>

        {/* Timer display (read-only) — shows minutes only, updates every 60s */}
        {liveSeconds !== null && (
          <div className="flex items-center justify-center gap-2 mt-2">
            {isTimerRunning
              ? <Play size={12} className="text-primary" />
              : <Pause size={12} className="text-text-muted" />}
            <span className={cn('font-black text-2xl tabular-nums tracking-tight', isTimerRunning ? 'text-text-main' : 'text-text-muted')}>
              {isTimerRunning
                ? `${Math.ceil(liveSeconds / 60)} min`
                : formatTime(liveSeconds)}
            </span>
          </div>
        )}
      </div>

      {/* Campo (read-only) */}
      <div className="mx-4 my-2 rounded-2xl overflow-hidden bg-green-900 relative" style={{ aspectRatio: '5/3' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/20" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/30" />
        </div>
        <LiveFieldSide players={jogadoresCasa} cor={timeCasa?.cor ?? '#6B7280'} side="left" />
        <LiveFieldSide players={jogadoresVisitante} cor={timeVisitante?.cor ?? '#6B7280'} side="right" />
      </div>

      {/* Eventos da partida */}
      {recentEvents.length > 0 && (
        <div className="px-4 mb-3">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Eventos</p>
          <div className="space-y-1.5">
            {recentEvents.map((ev, i) => {
              const p = ev.profiles
              const icon = ev.tipo === 'gol' ? '⚽' : ev.tipo === 'assistencia' ? '🅰️' : ev.tipo === 'cartao_amarelo' ? '🟨' : '🟥'
              return (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span>{icon}</span>
                  <span className="text-text-main font-medium">{p?.nome ?? '—'}</span>
                  {ev.minuto != null && <span className="text-text-muted text-xs">{ev.minuto}'</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="px-4 pb-8 mt-auto">
        <div className="bg-card rounded-2xl p-4 text-center">
          <Star size={16} className="text-secondary mx-auto mb-2" />
          <p className="text-text-main text-sm font-semibold">Votação MVP abrirá após a partida</p>
          <p className="text-text-muted text-xs mt-1">Fique ligado!</p>
        </div>
      </div>
    </div>
  )
}

function LiveFieldSide({ players, cor, side }) {
  const rows = splitRows(players)
  const isRight = side === 'right'
  const displayRows = isRight ? [...rows].reverse() : rows

  return (
    <div className={cn('absolute top-0 bottom-0 w-1/2 flex flex-col justify-around py-3', isRight ? 'right-0' : 'left-0')}>
      {displayRows.map((row, ri) => (
        <div key={ri} className={cn('flex px-3', row.length === 1 ? 'justify-center' : 'justify-around')}>
          {row.filter(Boolean).map(p => (
            <div key={p.id} className="flex flex-col items-center gap-0.5">
              <div className="w-8 h-8 rounded-full border-2 overflow-hidden bg-green-800" style={{ borderColor: cor }}>
                {p.foto_url
                  ? <img src={p.foto_url} alt={p.nome} className="w-full h-full object-contain" />
                  : <div className="w-full h-full flex items-center justify-center text-xs">👤</div>}
              </div>
              <span className="text-white text-[8px] font-bold max-w-[36px] truncate text-center leading-tight drop-shadow">
                {p.nome.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function splitRows(players) {
  const n = players.length
  if (n <= 0) return []
  if (n === 1) return [[players[0]]]
  if (n === 2) return [[players[0]], [players[1]]]
  if (n === 3) return [[players[0]], [players[1], players[2]]]
  if (n === 4) return [[players[0], players[1]], [players[2], players[3]]]
  return [[players[0]], [players[1], players[2]], [players[3], players[4]]]
}

function MatchHeader({ partida, timeCasa, timeVisitante, subtitle }) {
  return (
    <div className="px-4 pt-10 pb-4">
      <div className="flex items-center gap-2 mb-1">
        <Star size={16} className="text-secondary" />
        <span className="text-xs font-semibold text-text-muted uppercase tracking-widest">Partida</span>
      </div>
      <div className="flex items-center justify-center gap-3 mt-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: timeCasa?.cor }} />
          <span className="text-sm font-bold text-text-main">{timeCasa?.nome}</span>
        </div>
        <span className="text-text-muted font-black">{partida.gols_casa} – {partida.gols_visitante}</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: timeVisitante?.cor }} />
          <span className="text-sm font-bold text-text-main">{timeVisitante?.nome}</span>
        </div>
      </div>
      {subtitle && <p className="text-center text-xs text-text-muted mt-2">{subtitle}</p>}
    </div>
  )
}
