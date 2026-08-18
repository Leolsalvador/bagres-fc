import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, ArrowLeft, User } from 'lucide-react'
import { cn, teamDotStyle, playerKey } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCampeonato } from '@/context/CampeonatoContext'
import { USE_MOCK } from '@/lib/mockData'

const DURACAO = { 1: 5 * 60, i: 1 * 60, 2: 5 * 60 }

function formatTime(s) {
  if (s === null || s === undefined) return '--:--'
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'; osc.frequency.value = 880
    gain.gain.setValueAtTime(0.6, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 1)
  } catch (_) {}
}

// ── Main controller ───────────────────────────────────────────
export default function ControlePartida() {
  const { campeonato, partidas, times, jogadores, eventos, loading, refresh, updatePartidaLocal } = useCampeonato()
  const location = useLocation()
  const navigate = useNavigate()
  const [partidaSelecionada, setPartidaSelecionada] = useState(null)
  const [forceList, setForceList] = useState(false)

  useEffect(() => {
    const pid = location.state?.partidaId
    if (!pid || partidas.length === 0) return
    const found = partidas.find(p => p.id === pid)
    if (found) { setPartidaSelecionada(found); setForceList(false) }
  }, [location.state?.partidaId, partidas])

  if (loading && !campeonato) return (
    <div className="flex justify-center py-20">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!campeonato) return (
    <div className="min-h-full flex items-center justify-center text-text-muted text-sm px-8 text-center py-20">
      Nenhum campeonato ativo.
    </div>
  )

  const aoVivo = partidas.find(p => p.status === 'em_andamento')
  const partida = forceList ? null : (partidaSelecionada ?? aoVivo ?? null)
  const proximas = partidas.filter(p => p.status === 'agendada')

  if (partida) {
    const eventosPartida = eventos.filter(e => e.partida_id === partida.id)
    return (
      <PartidaControle
        key={partida.id}
        partida={partida}
        jogadores={jogadores}
        times={times}
        eventosIniciais={eventosPartida}
        onBack={() => { setPartidaSelecionada(null); setForceList(true) }}
        onRefresh={refresh}
        updatePartidaLocal={updatePartidaLocal}
      />
    )
  }

  return (
    <div className="min-h-full bg-background">
      <div className="px-4 pt-10 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-text-main uppercase tracking-widest">Controle</h1>
          <p className="text-text-muted text-sm">{campeonato.nome}</p>
        </div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted text-sm">
          <ArrowLeft size={16} /> Sair
        </button>
      </div>
      <div className="px-4 space-y-3 pb-8">
        {aoVivo && <PartidaAoVivoCard partida={aoVivo} times={times} onPress={() => { setPartidaSelecionada(aoVivo); setForceList(false) }} />}
        {proximas.length > 0 && (
          <>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mt-2">Próximas partidas</p>
            {proximas.map(p => {
              const tc = times.find(t => t.id === p.time_casa_id) ?? p.time_casa
              const tv = times.find(t => t.id === p.time_visitante_id) ?? p.time_visitante
              return (
                <button
                  key={p.id}
                  onClick={() => { setPartidaSelecionada(p); setForceList(false) }}
                  className="w-full bg-card rounded-2xl p-4 flex items-center gap-3 active:bg-elevated transition-colors"
                >
                  <div className="flex-1 flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={teamDotStyle(tc)} />
                      <span className="font-semibold text-text-main">{tc?.nome}</span>
                    </div>
                    <span className="text-text-muted text-xs">vs</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text-main">{tv?.nome}</span>
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={teamDotStyle(tv)} />
                    </div>
                  </div>
                  <Play size={16} className="text-primary shrink-0" />
                </button>
              )
            })}
          </>
        )}
        {!aoVivo && proximas.length === 0 && (
          <p className="text-text-muted text-sm text-center py-8">Todas as partidas foram realizadas.</p>
        )}
      </div>
    </div>
  )
}

function PartidaAoVivoCard({ partida: p, times, onPress }) {
  const tc = times.find(t => t.id === p.time_casa_id) ?? p.time_casa
  const tv = times.find(t => t.id === p.time_visitante_id) ?? p.time_visitante
  const [liveSeconds, setLiveSeconds] = useState(null)

  useEffect(() => {
    if (p.timer_end_ts) {
      const endTs = new Date(p.timer_end_ts).getTime()
      setLiveSeconds(Math.max(0, Math.round((endTs - Date.now()) / 1000)))
      const iv = setInterval(() => {
        const r = Math.max(0, Math.round((endTs - Date.now()) / 1000))
        setLiveSeconds(r)
        if (r <= 0) clearInterval(iv)
      }, 500)
      return () => clearInterval(iv)
    } else if (p.timer_paused_secs != null) {
      setLiveSeconds(p.timer_paused_secs)
    }
  }, [p.timer_end_ts, p.timer_paused_secs])

  return (
    <button
      onClick={onPress}
      className="w-full bg-primary/10 border border-primary/30 rounded-2xl p-4 flex items-center gap-3 active:bg-primary/20 transition-colors"
    >
      <div className="flex-1">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
          <span className="text-[10px] font-black text-danger uppercase tracking-widest">Ao Vivo</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={teamDotStyle(tc)} />
            <span className="font-semibold text-text-main">{tc?.nome}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-black text-text-main">{p.gols_casa}</span>
            <span className="text-text-muted text-xs">×</span>
            <span className="font-black text-text-main">{p.gols_visitante}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-main">{tv?.nome}</span>
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={teamDotStyle(tv)} />
          </div>
        </div>
      </div>
      {liveSeconds !== null && (
        <span className={cn('font-black text-lg tabular-nums shrink-0', p.timer_end_ts ? 'text-primary' : 'text-text-muted')}>
          {formatTime(liveSeconds)}
        </span>
      )}
    </button>
  )
}

// ── Full match control (admin field screen) ───────────────────
function PartidaControle({ partida: initialPartida, jogadores, times, eventosIniciais, onBack, onRefresh, updatePartidaLocal }) {
  const navigate = useNavigate()
  const [partida, setPartida] = useState(initialPartida)
  const [fase, setFase] = useState(initialPartida.half_atual || 0)
  const [seconds, setSeconds] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [timeExpired, setTimeExpired] = useState(false)
  const [localEventos, setLocalEventos] = useState(
    (eventosIniciais ?? []).map(ev => ({
      tipo: ev.tipo,
      nome: ev.profiles?.nome ?? ev.nome,
      minuto: ev.minuto,
    }))
  )
  const [showGolModal, setShowGolModal] = useState(false)
  const [showCartaoModal, setShowCartaoModal] = useState(false)
  const endTimeRef = useRef(null)
  const intervalRef = useRef(null)

  const timeCasa = times.find(t => t.id === partida.time_casa_id) ?? partida.time_casa
  const timeVisitante = times.find(t => t.id === partida.time_visitante_id) ?? partida.time_visitante
  const jogadoresCasa = jogadores.filter(j => j.time_id === partida.time_casa_id)
  const jogadoresVisitante = jogadores.filter(j => j.time_id === partida.time_visitante_id)
  const encerrada = partida.status === 'encerrada'

  // Initialize timer — always reads fresh state from DB so stale context props don't reset it
  useEffect(() => {
    if (USE_MOCK) {
      const p = initialPartida
      if (p.timer_end_ts) {
        const endTs = new Date(p.timer_end_ts).getTime()
        const remaining = Math.round((endTs - Date.now()) / 1000)
        if (remaining > 0) { endTimeRef.current = endTs; setSeconds(remaining); setIsRunning(true) }
        else { setSeconds(0); setTimeExpired(true) }
      } else if (p.timer_paused_secs != null) {
        setSeconds(p.timer_paused_secs)
      }
      return
    }
    supabase.from('campeonato_partidas')
      .select('timer_end_ts, timer_paused_secs, half_atual')
      .eq('id', initialPartida.id)
      .single()
      .then(({ data }) => {
        if (!data) return
        if (data.half_atual) setFase(data.half_atual)
        if (data.timer_end_ts) {
          const endTs = new Date(data.timer_end_ts).getTime()
          const remaining = Math.round((endTs - Date.now()) / 1000)
          if (remaining > 0) { endTimeRef.current = endTs; setSeconds(remaining); setIsRunning(true) }
          else { setSeconds(0); setTimeExpired(true) }
        } else if (data.timer_paused_secs != null) {
          setSeconds(data.timer_paused_secs)
        } else {
          const f = data.half_atual || 1
          setSeconds(DURACAO[f] ?? DURACAO[1])
        }
      })
  }, []) // eslint-disable-line

  // Recalculate timer from endTimeRef when tab comes back to foreground (handles alt+tab, background throttle)
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState !== 'visible') return
      if (!endTimeRef.current) return
      const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000))
      if (remaining <= 0) {
        clearInterval(intervalRef.current)
        setIsRunning(false)
        setSeconds(0)
        setTimeExpired(true)
      } else {
        setSeconds(remaining)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // Timer countdown
  useEffect(() => {
    if (!isRunning) { clearInterval(intervalRef.current); return }
    intervalRef.current = setInterval(() => {
      const remaining = Math.round((endTimeRef.current - Date.now()) / 1000)
      if (remaining <= 0) {
        clearInterval(intervalRef.current)
        setIsRunning(false)
        setSeconds(0)
        setTimeExpired(true)
        playBeep()
        saveTimer(null, 0)
      } else {
        setSeconds(remaining)
      }
    }, 500)
    return () => clearInterval(intervalRef.current)
  }, [isRunning])

  async function saveTimer(endTs, pausedSecs) {
    if (USE_MOCK) return
    await supabase.from('campeonato_partidas').update({
      timer_end_ts: endTs ? new Date(endTs).toISOString() : null,
      timer_paused_secs: pausedSecs ?? null,
    }).eq('id', partida.id)
  }

  function handleToggleTimer() {
    if (isRunning) {
      const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000))
      setIsRunning(false)
      setSeconds(remaining)
      saveTimer(null, remaining)
    } else {
      const secs = seconds ?? (DURACAO[fase] ?? DURACAO[1])
      const endTs = Date.now() + secs * 1000
      endTimeRef.current = endTs
      setIsRunning(true)
      setTimeExpired(false)
      saveTimer(endTs, null)
    }
  }

  function handleResetTimer() {
    clearInterval(intervalRef.current)
    setIsRunning(false)
    endTimeRef.current = null
    const dur = DURACAO[fase] ?? DURACAO[1]
    setSeconds(dur)
    setTimeExpired(false)
    saveTimer(null, dur)
  }

  async function iniciarPrimeiraTempo() {
    const dur = DURACAO[1]
    const endTs = Date.now() + dur * 1000
    endTimeRef.current = endTs
    setFase(1); setSeconds(dur); setIsRunning(true); setTimeExpired(false)
    const updates = { status: 'em_andamento', half_atual: 1, timer_end_ts: new Date(endTs).toISOString(), timer_paused_secs: null }
    if (!USE_MOCK) await supabase.from('campeonato_partidas').update(updates).eq('id', partida.id)
    else updatePartidaLocal(partida.id, updates)
    setPartida(p => ({ ...p, ...updates }))
  }

  async function iniciarIntervalo() {
    const dur = DURACAO.i
    const endTs = Date.now() + dur * 1000
    endTimeRef.current = endTs
    setFase('i'); setSeconds(dur); setIsRunning(true); setTimeExpired(false)
    const updates = { half_atual: 0, timer_end_ts: new Date(endTs).toISOString(), timer_paused_secs: null }
    if (!USE_MOCK) await supabase.from('campeonato_partidas').update(updates).eq('id', partida.id)
    else updatePartidaLocal(partida.id, updates)
  }

  async function iniciarSegundoTempo() {
    const dur = DURACAO[2]
    const endTs = Date.now() + dur * 1000
    endTimeRef.current = endTs
    setFase(2); setSeconds(dur); setIsRunning(true); setTimeExpired(false)
    const updates = { half_atual: 2, timer_end_ts: new Date(endTs).toISOString(), timer_paused_secs: null }
    if (!USE_MOCK) await supabase.from('campeonato_partidas').update(updates).eq('id', partida.id)
    else updatePartidaLocal(partida.id, updates)
    setPartida(p => ({ ...p, half_atual: 2 }))
  }

  async function encerrarPartida() {
    clearInterval(intervalRef.current)
    setIsRunning(false)
    const updates = { status: 'encerrada', half_atual: 0, votacao_mvp_aberta: true, timer_end_ts: null, timer_paused_secs: null }
    if (!USE_MOCK) await supabase.from('campeonato_partidas').update(updates).eq('id', partida.id)
    else updatePartidaLocal(partida.id, updates)
    setPartida(p => ({ ...p, ...updates }))
    onRefresh()
    navigate(`/campeonato/partida/${partida.id}`)
  }

  function getMinuto() {
    if (fase === 'i' || seconds === null) return null
    const dur = DURACAO[fase] ?? DURACAO[1]
    return Math.max(1, Math.ceil((dur - seconds) / 60))
  }

  function montarEvento(jogador, timeId, tipo, minuto, faseNum) {
    const base = { partida_id: partida.id, time_id: timeId, tipo, minuto, half: faseNum, campeonato_id: partida.campeonato_id }
    return jogador.is_guest
      ? { ...base, jogador_id: null, is_guest: true, guest_nome: jogador.nome, guest_time_jogador_id: jogador.tj_id }
      : { ...base, jogador_id: jogador.id }
  }

  async function handleAddGol(scorer, timeId, assistente) {
    const isCasa = timeId === partida.time_casa_id
    const campo = isCasa ? 'gols_casa' : 'gols_visitante'
    const novoGol = (isCasa ? partida.gols_casa : partida.gols_visitante) + 1
    const minuto = getMinuto()
    const faseNum = fase !== 'i' ? fase : null

    const evs = [montarEvento(scorer, timeId, 'gol', minuto, faseNum)]
    if (assistente) evs.push(montarEvento(assistente, timeId, 'assistencia', minuto, faseNum))

    if (!USE_MOCK) {
      await Promise.all([
        supabase.from('campeonato_partidas').update({ [campo]: novoGol }).eq('id', partida.id),
        supabase.from('campeonato_eventos').insert(evs),
      ])
    }
    setPartida(p => ({ ...p, [campo]: novoGol }))

    setLocalEventos(ev => [
      ...ev,
      { tipo: 'gol', nome: scorer.nome, minuto },
      ...(assistente ? [{ tipo: 'assistencia', nome: assistente.nome, minuto }] : []),
    ])
    setShowGolModal(false)
  }

  async function handleAddCartao(jogador, timeId, tipo) {
    const minuto = getMinuto()
    const faseNum = fase !== 'i' ? fase : null
    if (!USE_MOCK) {
      await supabase.from('campeonato_eventos').insert(montarEvento(jogador, timeId, tipo, minuto, faseNum))
    }
    setLocalEventos(ev => [...ev, { tipo, nome: jogador.nome, minuto }])
    setShowCartaoModal(false)
  }

  const fasePlaying = fase === 1 || fase === 2

  return (
    <div className="min-h-full bg-background flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <button onClick={onBack} className="flex items-center gap-1 text-text-muted text-sm mb-3">
          <ArrowLeft size={16} /> Voltar
        </button>

        {/* Phase badge */}
        {!encerrada && fase !== 0 && (
          <div className="flex items-center justify-between mb-2">
            <span className={cn(
              'text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full',
              fase === 'i' ? 'bg-secondary/20 text-secondary' :
              fase === 1 ? 'bg-primary/20 text-primary' : 'bg-blue-500/20 text-blue-400'
            )}>
              {fase === 1 ? '1° TEMPO' : fase === 'i' ? '⏸ INTERVALO' : '2° TEMPO'}
            </span>
            {timeExpired && fasePlaying && (
              <span className="text-[10px] font-black text-danger animate-pulse uppercase">Tempo esgotado</span>
            )}
          </div>
        )}
        {encerrada && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-border text-text-muted">Encerrada</span>
          </div>
        )}

        {/* Score */}
        <div className="flex items-center justify-between">
          <p
            className="font-black text-sm uppercase truncate max-w-[90px]"
            style={{ color: timeCasa?.cor ?? '#9CA3AF' }}
          >
            {timeCasa?.nome ?? '—'}
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-text-main font-black text-4xl">{partida.gols_casa}</span>
            <span className="text-text-muted text-lg">×</span>
            <span className="text-text-main font-black text-4xl">{partida.gols_visitante}</span>
          </div>
          <p
            className="font-black text-sm uppercase truncate max-w-[90px] text-right"
            style={{ color: timeVisitante?.cor ?? '#9CA3AF' }}
          >
            {timeVisitante?.nome ?? '—'}
          </p>
        </div>
      </div>

      {/* Timer */}
      {(fasePlaying || fase === 'i') && !encerrada && (
        <div className="flex items-center justify-center gap-6 py-2 px-4">
          <button
            onClick={handleResetTimer}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center active:scale-95 transition-transform"
          >
            <RotateCcw size={16} className="text-text-muted" />
          </button>
          <span className={cn(
            'font-black text-5xl tabular-nums tracking-tight',
            timeExpired && fasePlaying ? 'text-danger animate-pulse' :
            fase === 'i' ? 'text-secondary' : 'text-text-main'
          )}>
            {formatTime(seconds)}
          </span>
          <button
            onClick={handleToggleTimer}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform',
              fase === 'i' ? 'bg-secondary' : 'bg-primary'
            )}
          >
            {isRunning
              ? <Pause size={18} className="text-black" />
              : <Play size={18} className="text-black" />}
          </button>
        </div>
      )}

      {/* Campo */}
      <CampoField
        jogadoresCasa={jogadoresCasa}
        jogadoresVisitante={jogadoresVisitante}
        corCasa={timeCasa?.cor ?? '#6B7280'}
        corVisitante={timeVisitante?.cor ?? '#6B7280'}
      />

      {/* Bottom actions */}
      <div className="px-4 pb-6 mt-auto pt-2 space-y-2">
        {/* Not started */}
        {fase === 0 && !encerrada && (
          <button
            onClick={iniciarPrimeiraTempo}
            className="w-full bg-primary text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Play size={18} /> Iniciar 1° Tempo
          </button>
        )}

        {/* Interval */}
        {fase === 'i' && !encerrada && (
          <button
            onClick={iniciarSegundoTempo}
            className="w-full bg-primary text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Play size={18} /> Iniciar 2° Tempo
          </button>
        )}

        {/* Playing */}
        {fasePlaying && !encerrada && (
          <>
            <button
              onClick={() => setShowGolModal(true)}
              className="w-full bg-card border border-border text-text-main font-bold py-3.5 rounded-2xl active:scale-95 transition-transform text-sm flex items-center justify-center gap-2"
            >
              ⚽ Registrar Gol
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCartaoModal(true)}
                className="flex-1 bg-card border border-border text-text-main font-bold py-3.5 rounded-2xl active:scale-95 transition-transform text-sm flex items-center justify-center gap-1.5"
              >
                🟨 Cartão
              </button>
              {fase === 1 ? (
                <button
                  onClick={iniciarIntervalo}
                  className="flex-1 bg-secondary/10 text-secondary font-bold py-3.5 rounded-2xl active:scale-95 transition-transform text-sm"
                >
                  → Intervalo
                </button>
              ) : (
                <button
                  onClick={encerrarPartida}
                  className="flex-1 bg-primary text-black font-bold py-3.5 rounded-2xl active:scale-95 transition-transform text-sm"
                >
                  🏁 Finalizar
                </button>
              )}
            </div>
          </>
        )}

        {/* Encerrada */}
        {encerrada && (
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 text-center">
            <p className="text-primary font-black">Partida encerrada ✓</p>
            <p className="text-text-muted text-xs mt-1">
              {partida.gols_casa} – {partida.gols_visitante}
            </p>
          </div>
        )}
      </div>

      {/* Eventos */}
      {localEventos.length > 0 && (
        <div className="px-4 pb-6">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Eventos</p>
          <div className="bg-card rounded-xl divide-y divide-border/40">
            {[...localEventos].reverse().map((ev, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2">
                <span className="text-base shrink-0">
                  {ev.tipo === 'gol' ? '⚽' : ev.tipo === 'assistencia' ? '🅰️' : ev.tipo === 'cartao_amarelo' ? '🟨' : '🟥'}
                </span>
                <span className="text-sm text-text-main font-medium flex-1">{ev.nome ?? '—'}</span>
                {ev.minuto != null && (
                  <span className="text-xs text-text-muted shrink-0">{ev.minuto}'</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Registrar gol */}
      {showGolModal && (
        <GolModal
          jogadoresCasa={jogadoresCasa}
          jogadoresVisitante={jogadoresVisitante}
          timeCasa={timeCasa}
          timeVisitante={timeVisitante}
          timeCasaId={partida.time_casa_id}
          timeVisitanteId={partida.time_visitante_id}
          onConfirm={handleAddGol}
          onClose={() => setShowGolModal(false)}
        />
      )}

      {/* Modal: Cartão */}
      {showCartaoModal && (
        <CartaoModal
          jogadoresCasa={jogadoresCasa}
          jogadoresVisitante={jogadoresVisitante}
          timeCasa={timeCasa}
          timeVisitante={timeVisitante}
          timeCasaId={partida.time_casa_id}
          timeVisitanteId={partida.time_visitante_id}
          onConfirm={handleAddCartao}
          onClose={() => setShowCartaoModal(false)}
        />
      )}
    </div>
  )
}

// ── Campo (green field visualization) ────────────────────────
function CampoField({ jogadoresCasa, jogadoresVisitante, corCasa, corVisitante }) {
  return (
    <div className="mx-4 my-2 rounded-2xl overflow-hidden bg-green-900 relative" style={{ aspectRatio: '5/3' }}>
      {/* Lines */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/20" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/30" />
      </div>
      <FieldSide players={jogadoresCasa} cor={corCasa} side="left" />
      <FieldSide players={jogadoresVisitante} cor={corVisitante} side="right" />
    </div>
  )
}

function FieldSide({ players, cor, side }) {
  const rows = splitPlayerRows(players)
  const isRight = side === 'right'
  const displayRows = isRight ? [...rows].reverse() : rows

  return (
    <div className={cn(
      'absolute top-0 bottom-0 w-1/2 flex flex-col justify-around py-3',
      isRight ? 'right-0' : 'left-0'
    )}>
      {displayRows.map((row, ri) => (
        <div key={ri} className={cn('flex px-3', row.length === 1 ? 'justify-center' : 'justify-around')}>
          {row.filter(Boolean).map(p => (
            <div key={playerKey(p)} className="flex flex-col items-center gap-0.5">
              <div
                className="w-8 h-8 rounded-full border-2 overflow-hidden bg-green-800"
                style={{ borderColor: cor }}
              >
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

function splitPlayerRows(players) {
  const n = players.length
  if (n <= 0) return []
  if (n === 1) return [[players[0]]]
  if (n === 2) return [[players[0]], [players[1]]]
  if (n === 3) return [[players[0]], [players[1], players[2]]]
  if (n === 4) return [[players[0], players[1]], [players[2], players[3]]]
  return [[players[0]], [players[1], players[2]], [players[3], players[4]]]
}

// ── Gol Modal ─────────────────────────────────────────────────
function GolModal({ jogadoresCasa, jogadoresVisitante, timeCasa, timeVisitante, timeCasaId, timeVisitanteId, onConfirm, onClose }) {
  const [step, setStep] = useState('artilheiro') // 'artilheiro' | 'assistencia'
  const [artilheiro, setArtilheiro] = useState(null)  // { id, timeId }
  const [assistencia, setAssistencia] = useState(null)

  function selectArtilheiro(jogador, timeId) {
    setArtilheiro({ jogador, timeId })
    setStep('assistencia')
  }

  function confirmar() {
    if (!artilheiro) return
    onConfirm(artilheiro.jogador, artilheiro.timeId, assistencia)
  }

  const artilheiroTeamPlayers = !artilheiro ? [] : artilheiro.timeId === timeCasaId
    ? jogadoresCasa.filter(j => playerKey(j) !== playerKey(artilheiro.jogador))
    : jogadoresVisitante.filter(j => playerKey(j) !== playerKey(artilheiro.jogador))

  return (
    <BottomSheet
      title={step === 'artilheiro' ? '⚽ Quem fez o gol?' : '👟 Quem deu a assistência?'}
      onClose={step === 'artilheiro' ? onClose : null}
    >
      {step === 'artilheiro' ? (
        <>
          <TimeSection time={timeCasa} jogadores={jogadoresCasa} onSelect={j => selectArtilheiro(j, timeCasaId)} />
          <TimeSection time={timeVisitante} jogadores={jogadoresVisitante} onSelect={j => selectArtilheiro(j, timeVisitanteId)} />
        </>
      ) : (
        <>
          <p className="text-text-muted text-xs mb-3">Opcional — pule se não houve</p>
          <div className="space-y-1">
            {artilheiroTeamPlayers.map(j => (
              <PlayerBtn key={playerKey(j)} jogador={j} selected={assistencia && playerKey(assistencia) === playerKey(j)} onSelect={() => setAssistencia(j)} />
            ))}
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t border-border">
            <button
              onClick={() => { setStep('artilheiro'); setAssistencia(null) }}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-text-muted bg-elevated"
            >
              Voltar
            </button>
            <button
              onClick={confirmar}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-black bg-primary"
            >
              {assistencia ? 'Confirmar' : 'Sem assistência'}
            </button>
          </div>
        </>
      )}
    </BottomSheet>
  )
}

// ── Cartão Modal ──────────────────────────────────────────────
function CartaoModal({ jogadoresCasa, jogadoresVisitante, timeCasa, timeVisitante, timeCasaId, timeVisitanteId, onConfirm, onClose }) {
  const [step, setStep] = useState('jogador') // 'jogador' | 'tipo'
  const [jogador, setJogador] = useState(null)  // { jogador, timeId }

  function selectJogador(j, timeId) {
    setJogador({ jogador: j, timeId })
    setStep('tipo')
  }

  return (
    <BottomSheet
      title={step === 'jogador' ? '🟨 Cartão — Para quem?' : '🟨 Qual cartão?'}
      onClose={step === 'jogador' ? onClose : null}
    >
      {step === 'jogador' ? (
        <>
          <TimeSection time={timeCasa} jogadores={jogadoresCasa} onSelect={j => selectJogador(j, timeCasaId)} />
          <TimeSection time={timeVisitante} jogadores={jogadoresVisitante} onSelect={j => selectJogador(j, timeVisitanteId)} />
        </>
      ) : (
        <>
          <p className="text-text-muted text-xs mb-4">Selecione o tipo de cartão</p>
          <div className="flex gap-3">
            <button
              onClick={() => onConfirm(jogador.jogador, jogador.timeId, 'cartao_amarelo')}
              className="flex-1 bg-secondary/10 border-2 border-secondary/30 rounded-2xl py-6 flex flex-col items-center gap-2 active:scale-95 transition-transform"
            >
              <span className="text-3xl">🟨</span>
              <span className="text-secondary font-bold text-sm">Amarelo</span>
            </button>
            <button
              onClick={() => onConfirm(jogador.jogador, jogador.timeId, 'cartao_vermelho')}
              className="flex-1 bg-danger/10 border-2 border-danger/30 rounded-2xl py-6 flex flex-col items-center gap-2 active:scale-95 transition-transform"
            >
              <span className="text-3xl">🟥</span>
              <span className="text-danger font-bold text-sm">Vermelho</span>
            </button>
          </div>
          <button
            onClick={() => setStep('jogador')}
            className="w-full mt-3 py-3 rounded-xl text-sm font-semibold text-text-muted bg-elevated"
          >
            Voltar
          </button>
        </>
      )}
    </BottomSheet>
  )
}

// ── Shared sub-components ─────────────────────────────────────
function BottomSheet({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/70" onClick={onClose ?? undefined} />
      <div className="relative bg-card rounded-t-3xl p-5 max-h-[80vh] flex flex-col mb-16">
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
        <h3 className="text-text-main font-bold text-base mb-3">{title}</h3>
        <div className="overflow-y-auto flex-1 pb-2">{children}</div>
      </div>
    </div>
  )
}

function TimeSection({ time, jogadores, onSelect }) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2.5 h-2.5 rounded-full" style={teamDotStyle(time)} />
        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{time?.nome}</span>
      </div>
      <div className="space-y-1">
        {jogadores.map(j => (
          <PlayerBtn key={playerKey(j)} jogador={j} onSelect={() => onSelect(j)} />
        ))}
      </div>
    </div>
  )
}

function PlayerBtn({ jogador, selected = false, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors',
        selected ? 'bg-primary/15 border border-primary/30' : 'bg-elevated active:bg-border'
      )}
    >
      <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center overflow-hidden shrink-0">
        {jogador.foto_url
          ? <img src={jogador.foto_url} alt={jogador.nome} className="w-full h-full object-contain" />
          : <User size={14} className="text-text-muted" />}
      </div>
      <span className={cn('text-sm font-semibold', selected ? 'text-primary' : 'text-text-main')}>
        {jogador.nome}
      </span>
    </button>
  )
}
