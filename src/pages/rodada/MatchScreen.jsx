import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const DURATION_FIRST  = 10 * 60 // 10 minutos (1º jogo)
const DURATION_NORMAL =  8 * 60 //  8 minutos (demais)

const TEAM_COLORS = [
  { border: 'border-blue-500',   text: 'text-blue-400',   playerBorder: 'border-blue-400'   },
  { border: 'border-red-500',    text: 'text-red-400',    playerBorder: 'border-red-400'    },
  { border: 'border-yellow-500', text: 'text-yellow-400', playerBorder: 'border-yellow-400' },
  { border: 'border-green-500',  text: 'text-green-400',  playerBorder: 'border-green-400'  },
]

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.6, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 1)
  } catch (_) {}
}

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

const STORAGE_KEY = 'match-state'

export default function MatchScreen({ match, teamAIndex, teamBIndex, isFirstMatch, onEnd, onBack }) {
  const duration = isFirstMatch ? DURATION_FIRST : DURATION_NORMAL
  const [seconds, setSeconds]         = useState(duration)
  const [isRunning, setIsRunning]     = useState(false)
  const [goalsA, setGoalsA]           = useState(0)
  const [goalsB, setGoalsB]           = useState(0)
  const [events, setEvents]           = useState([])
  const [timeExpired, setTimeExpired] = useState(false)

  // Modals
  const [goalModal, setGoalModal]       = useState(false)
  const [assistModal, setAssistModal]   = useState(false)
  const [drawNotice, setDrawNotice]     = useState(!!match.autoStart)
  const [pendingGoal, setPendingGoal]   = useState(null) // { player, team: 'A'|'B' }

  const intervalRef  = useRef(null)
  const wakeLockRef  = useRef(null)
  const endTimeRef   = useRef(null) // timestamp absoluto em que o timer chega a 0
  const audioCtxRef  = useRef(null) // AudioContext silencioso (ativa Media Session no iOS)
  const isRunningRef = useRef(false)
  const secondsRef   = useRef(duration)

  // ── Wake Lock: impede a tela de apagar enquanto roda ─────────
  async function requestWakeLock() {
    if (!('wakeLock' in navigator)) return
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen')
    } catch (_) {}
  }
  function releaseWakeLock() {
    wakeLockRef.current?.release()
    wakeLockRef.current = null
  }

  // ── Sync refs com estado ────────────────────────────────────
  useEffect(() => { isRunningRef.current = isRunning }, [isRunning])
  useEffect(() => { secondsRef.current   = seconds   }, [seconds])

  // ── Áudio silencioso para ativar Media Session no iOS ─────────
  function startSilentAudio() {
    if (audioCtxRef.current) return
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) return
      const ctx  = new Ctx()
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      gain.gain.value = 0.001
      osc.connect(gain)
      const dest = ctx.createMediaStreamDestination()
      gain.connect(dest)
      osc.start()
      const audio = new Audio()
      audio.srcObject = dest.stream
      audio.loop = true
      audio.play().catch(() => {})
      audioCtxRef.current = { ctx, osc, audio }
    } catch (_) {}
  }

  function stopSilentAudio() {
    try {
      audioCtxRef.current?.osc?.stop()
      audioCtxRef.current?.ctx?.close()
      const a = audioCtxRef.current?.audio
      if (a) { a.pause(); a.srcObject = null }
    } catch (_) {}
    audioCtxRef.current = null
  }

  // ── Service Worker: agenda alarme no fim do timer ─────────────
  function sendAlarmToSW(endTimestamp) {
    try {
      navigator.serviceWorker?.controller?.postMessage({
        type: 'TIMER_ALARM_SET', endTimestamp,
        teamA: match.teamA.nome, teamB: match.teamB.nome,
      })
    } catch (_) {}
  }
  function cancelSWAlarm() {
    try {
      navigator.serviceWorker?.controller?.postMessage({ type: 'TIMER_ALARM_CANCEL' })
    } catch (_) {}
  }

  // ── Media Session: atualiza artista com tempo restante ────────
  function updateMediaSessionArtist(secs) {
    try {
      if (navigator.mediaSession?.metadata)
        navigator.mediaSession.metadata.artist = `⏱ ${formatTime(secs)} restante`
    } catch (_) {}
  }

  // ── Restaura estado salvo ao montar ──────────────────────────
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const s = JSON.parse(raw)
      if (s.teamA !== match.teamA.nome || s.teamB !== match.teamB.nome) {
        localStorage.removeItem(STORAGE_KEY); return
      }
      setGoalsA(s.goalsA ?? 0)
      setGoalsB(s.goalsB ?? 0)
      setEvents(s.events ?? [])
      if (s.isRunning && s.endTimestamp) {
        const remaining = Math.round((s.endTimestamp - Date.now()) / 1000)
        if (remaining > 0) {
          endTimeRef.current = s.endTimestamp
          setSeconds(remaining)
          setIsRunning(true)
        } else {
          setSeconds(0); setTimeExpired(true)
        }
      } else {
        setSeconds(s.seconds ?? duration)
        setTimeExpired(s.timeExpired ?? false)
      }
    } catch (_) { localStorage.removeItem(STORAGE_KEY) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Persiste estado a cada tick ───────────────────────────────
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      teamA: match.teamA.nome, teamB: match.teamB.nome,
      seconds, isRunning,
      endTimestamp: endTimeRef.current,
      timeExpired, goalsA, goalsB, events,
    }))
  }, [seconds, isRunning, timeExpired, goalsA, goalsB, events, match])

  // ── Timer com timestamp absoluto ─────────────────────────────
  useEffect(() => {
    if (isRunning) {
      requestWakeLock()
      sendAlarmToSW(endTimeRef.current)
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'
      intervalRef.current = setInterval(() => {
        const remaining = Math.round((endTimeRef.current - Date.now()) / 1000)
        if (remaining <= 0) {
          clearInterval(intervalRef.current)
          setIsRunning(false)
          setTimeExpired(true)
          setSeconds(0)
          releaseWakeLock()
          playBeep()
          cancelSWAlarm()
          stopSilentAudio()
        } else {
          setSeconds(remaining)
          updateMediaSessionArtist(remaining)
        }
      }, 500)
    } else {
      clearInterval(intervalRef.current)
      releaseWakeLock()
      cancelSWAlarm()
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'
    }
    return () => { clearInterval(intervalRef.current); releaseWakeLock() }
  }, [isRunning])

  // ── Reativa wake lock e corrige timer ao voltar do background ─
  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState !== 'visible' || !isRunning) return
      requestWakeLock()
      startSilentAudio() // tenta reativar áudio (funciona no Android)
      sendAlarmToSW(endTimeRef.current) // reagénda alarm no SW
      if (endTimeRef.current) {
        const remaining = Math.round((endTimeRef.current - Date.now()) / 1000)
        if (remaining <= 0) {
          setSeconds(0); setIsRunning(false); setTimeExpired(true); playBeep()
          cancelSWAlarm(); stopSilentAudio()
        } else {
          setSeconds(remaining)
        }
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [isRunning])

  const colorA = TEAM_COLORS[teamAIndex % TEAM_COLORS.length]
  const colorB = TEAM_COLORS[teamBIndex % TEAM_COLORS.length]

  // ── Media Session: configura metadados e botões da tela bloqueada ─
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title:  `${match.teamA.nome} × ${match.teamB.nome}`,
      artist: `⏱ ${formatTime(duration)} — Pronto para iniciar`,
      album:  'Bagres FC 🏆',
    })
    // Botões da tela bloqueada controlam o timer
    navigator.mediaSession.setActionHandler('play',  () => {
      if (!isRunningRef.current) {
        endTimeRef.current = Date.now() + secondsRef.current * 1000
        setIsRunning(true)
      }
    })
    navigator.mediaSession.setActionHandler('pause', () => setIsRunning(false))
    navigator.mediaSession.setActionHandler('stop',  () => {
      setIsRunning(false)
      endTimeRef.current = null
      setSeconds(duration)
      setTimeExpired(false)
    })
    return () => {
      try {
        navigator.mediaSession.metadata = null
        ;['play','pause','stop'].forEach(a => navigator.mediaSession.setActionHandler(a, null))
      } catch (_) {}
      stopSilentAudio()
      cancelSWAlarm()
    }
  }, []) // eslint-disable-line

  useEffect(() => {
    if (!drawNotice) return
    const t = setTimeout(() => setDrawNotice(false), 2500)
    return () => clearTimeout(t)
  }, [drawNotice])

  function handleToggleTimer() {
    if (!isRunning) {
      // Pede permissão de notificação na 1ª interação (precisa de user gesture)
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {})
      }
      startSilentAudio()  // ativa Media Session no iOS (precisa de user gesture)
      endTimeRef.current = Date.now() + seconds * 1000
    }
    setIsRunning(r => !r)
  }

  function resetTimer() {
    cancelSWAlarm()
    stopSilentAudio()
    setIsRunning(false)
    endTimeRef.current = null
    setSeconds(duration)
    setTimeExpired(false)
    try {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused'
        if (navigator.mediaSession.metadata)
          navigator.mediaSession.metadata.artist = `⏱ ${formatTime(duration)} — Pronto`
      }
    } catch (_) {}
  }

  function handleGoalSelect(player, team) {
    setPendingGoal({ player, team })
    setGoalModal(false)
    setAssistModal(true)
  }

  function handleAssistSelect(assistPlayer) {
    if (!pendingGoal) return
    const minute = Math.floor((duration - seconds) / 60)

    setEvents(ev => [
      ...ev,
      { type: 'gol', player: pendingGoal.player, team: pendingGoal.team, minute },
      ...(assistPlayer ? [{ type: 'assistencia', player: assistPlayer, team: pendingGoal.team, minute }] : []),
    ])

    if (pendingGoal.team === 'A') setGoalsA(g => g + 1)
    else setGoalsB(g => g + 1)

    setPendingGoal(null)
    setAssistModal(false)
  }

  function handleEndGame() {
    cancelSWAlarm()
    stopSilentAudio()
    localStorage.removeItem(STORAGE_KEY)
    const winner = goalsA > goalsB ? 'A' : goalsB > goalsA ? 'B' : 'draw'
    onEnd({ teamA: match.teamA, teamB: match.teamB, goalsA, goalsB, winner, events })
  }

  const allPlayers = [
    ...match.teamA.players.map(p => ({ ...p, team: 'A' })),
    ...match.teamB.players.map(p => ({ ...p, team: 'B' })),
  ]

  return (
    <div className="min-h-full bg-background flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <button onClick={onBack} className="flex items-center gap-1 text-text-muted text-sm mb-4">
          <ArrowLeft size={16} /> Trocar partida
        </button>

        {/* Score */}
        <div className="flex items-center justify-between">
          <p className={cn('font-black text-base uppercase', colorA.text)}>{match.teamA.nome}</p>
          <div className="flex items-center gap-3">
            <span className="text-text-main font-black text-4xl">{goalsA}</span>
            <span className="text-text-muted text-lg">×</span>
            <span className="text-text-main font-black text-4xl">{goalsB}</span>
          </div>
          <p className={cn('font-black text-base uppercase', colorB.text)}>{match.teamB.nome}</p>
        </div>
      </div>

      {/* Timer */}
      <div className="flex items-center justify-center gap-6 py-2 px-4">
        <button onClick={resetTimer} className="w-10 h-10 rounded-full bg-card flex items-center justify-center active:scale-95 transition-transform">
          <RotateCcw size={16} className="text-text-muted" />
        </button>
        <span className={cn('font-black text-5xl tabular-nums tracking-tight', timeExpired ? 'text-danger animate-pulse' : 'text-text-main')}>
          {formatTime(seconds)}
        </span>
        <button
          onClick={handleToggleTimer}
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center active:scale-95 transition-transform"
        >
          {isRunning
            ? <Pause size={18} className="text-black" />
            : <Play size={18} className="text-black" />}
        </button>
      </div>

      {/* Campo */}
      <div className="mx-4 my-3 rounded-2xl overflow-hidden bg-green-900 relative" style={{ aspectRatio: '5/3' }}>
        {/* Linhas do campo */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/20" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/30" />
        </div>

        {/* Time A (esquerda) */}
        <FieldSide players={match.teamA.players} color={colorA} side="left" />

        {/* Time B (direita) */}
        <FieldSide players={match.teamB.players} color={colorB} side="right" />
      </div>

      {/* Eventos recentes */}
      {events.length > 0 && (
        <div className="px-4 mb-2 flex gap-2 overflow-x-auto">
          {[...events].reverse().slice(0, 5).map((ev, i) => (
            <span key={i} className="text-xs bg-card text-text-muted px-2 py-1 rounded-lg whitespace-nowrap shrink-0">
              {ev.type === 'gol' ? '⚽' : '🅰️'} {ev.player.nome.split(' ')[0]} {ev.minute}'
            </span>
          ))}
        </div>
      )}

      {/* Botões de ação */}
      <div className="px-4 pb-6 flex gap-3 mt-auto">
        <button
          onClick={() => setGoalModal(true)}
          className="flex-1 bg-card border border-border text-text-main font-bold py-4 rounded-2xl active:scale-95 transition-transform text-sm flex items-center justify-center gap-2"
        >
          ⚽ Registrar gol
        </button>
        <button
          onClick={handleEndGame}
          className="flex-1 bg-primary text-black font-bold py-4 rounded-2xl active:scale-95 transition-transform text-sm flex items-center justify-center gap-2"
        >
          🏁 Finalizar jogo
        </button>
      </div>

      {/* Modal: Gol */}
      {goalModal && (
        <PlayerSelectModal
          title="Quem fez o gol?"
          teamA={match.teamA}
          teamB={match.teamB}
          colorA={colorA}
          colorB={colorB}
          onSelect={handleGoalSelect}
          onClose={() => setGoalModal(false)}
        />
      )}

      {/* Modal: Assistência */}
      {assistModal && pendingGoal && (
        <AssistModal
          title="Teve assistência?"
          players={match[pendingGoal.team === 'A' ? 'teamA' : 'teamB'].players}
          color={pendingGoal.team === 'A' ? colorA : colorB}
          scorer={pendingGoal.player}
          onSelect={handleAssistSelect}
        />
      )}

      {/* Aviso: troca automática após empate */}
      {drawNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 pointer-events-none">
          <div
            className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl pointer-events-auto text-center"
            onClick={() => setDrawNotice(false)}
          >
            <p className="text-3xl mb-3">🔄</p>
            <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-2">Empate — Troca automática</p>
            <p className={cn('font-black text-lg', colorA.text)}>{match.teamA.nome}</p>
            <p className="text-text-muted text-sm my-1">vs</p>
            <p className={cn('font-black text-lg', colorB.text)}>{match.teamB.nome}</p>
            <p className="text-text-muted text-xs mt-4">Toque para fechar</p>
          </div>
        </div>
      )}

    </div>
  )
}

// ── Campo: lado do time ──────────────────────────────────────
function FieldSide({ players, color, side }) {
  // Formação 1-2-2: [P0], [P1,P2], [P3,P4]
  const rows = [[players[0]], [players[1], players[2]], [players[3], players[4]]]
  const isRight = side === 'right'

  return (
    <div className={cn('absolute top-0 bottom-0 w-1/2 flex flex-col justify-around py-2', isRight ? 'right-0' : 'left-0')}>
      {(isRight ? [...rows].reverse() : rows).map((row, ri) => (
        <div key={ri} className={cn('flex justify-around px-2', row.length === 1 && 'justify-center')}>
          {row.filter(Boolean).map(p => (
            <div key={p.id} className="flex flex-col items-center gap-0.5">
              <div className={cn('w-8 h-8 rounded-full border-2 overflow-hidden bg-green-800', color.playerBorder)}>
                {p.foto_url
                  ? <img src={p.foto_url} alt={p.nome} className="w-full h-full object-contain" />
                  : <div className="w-full h-full flex items-center justify-center text-sm">👤</div>}
              </div>
              <span className="text-white text-[8px] font-bold max-w-[36px] truncate text-center leading-tight">
                {p.nome.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Modal: Selecionar jogador para gol ────────────────────────
function PlayerSelectModal({ title, teamA, teamB, colorA, colorB, onSelect, onClose }) {
  return (
    <BottomSheet title={title} onClose={onClose}>
      <TeamSection team={teamA} color={colorA} onSelect={p => onSelect(p, 'A')} />
      <TeamSection team={teamB} color={colorB} onSelect={p => onSelect(p, 'B')} />
    </BottomSheet>
  )
}

// ── Modal: Assistência ────────────────────────────────────────
function AssistModal({ title, players, color, scorer, onSelect }) {
  const others = players.filter(p => p.id !== scorer.id)
  return (
    // Sem onClose — modal de assistência só fecha via seleção
    <BottomSheet title={title} onClose={null}>
      <button
        onClick={() => onSelect(null)}
        className="w-full py-3 rounded-xl border border-border text-text-muted text-sm font-semibold mb-3 active:scale-95 transition-transform"
      >
        Sem assistência
      </button>
      <TeamSection team={{ nome: '', players: others }} color={color} onSelect={p => onSelect(p)} hideHeader />
    </BottomSheet>
  )
}

// ── Componentes reutilizáveis ─────────────────────────────────
function BottomSheet({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      <div className="absolute inset-0 bg-black/70" onClick={onClose ?? undefined} />
      <div className="relative bg-card rounded-3xl p-5 w-full max-w-sm max-h-[80vh] overflow-y-auto shadow-2xl">
        <h3 className="text-text-main font-bold text-base mb-3">{title}</h3>
        {children}
      </div>
    </div>
  )
}

function TeamSection({ team, color, onSelect, hideHeader = false }) {
  return (
    <div className="mb-3">
      {!hideHeader && <p className={cn('text-xs font-bold uppercase mb-2', color.text)}>{team.nome}</p>}
      <div className="space-y-1">
        {team.players.map(p => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-elevated active:bg-border transition-colors"
          >
            <div className={cn('w-8 h-8 rounded-full border-2 overflow-hidden bg-card shrink-0', color.playerBorder)}>
              {p.foto_url
                ? <img src={p.foto_url} alt={p.nome} className="w-full h-full object-contain" />
                : <div className="w-full h-full flex items-center justify-center text-sm">👤</div>}
            </div>
            <div className="text-left">
              <p className="text-text-main text-sm font-semibold">{p.nome}</p>
              <p className="text-text-muted text-xs">⭐ {p.rating.toFixed(1)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
