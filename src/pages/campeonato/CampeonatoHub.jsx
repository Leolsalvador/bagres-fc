import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, Swords, Star, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCampeonato } from '@/context/CampeonatoContext'
import { useAuth } from '@/hooks/useAuth'

const TABS = [
  { key: 'classificacao', label: 'Classificação' },
  { key: 'partidas',      label: 'Partidas'      },
  { key: 'destaques',     label: 'Destaques'     },
]

export default function CampeonatoHub() {
  const { campeonato, loading } = useCampeonato()
  const [tab, setTab] = useState('classificacao')

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!campeonato) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-3 text-text-muted px-8">
        <Trophy size={48} className="opacity-20" />
        <p className="text-sm text-center">Nenhum campeonato ativo no momento.</p>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="px-4 pt-10 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Trophy size={18} className="text-secondary" />
          <span className="text-xs font-semibold text-text-muted uppercase tracking-widest">Campeonato</span>
        </div>
        <h1 className="text-2xl font-black text-text-main">{campeonato.nome}</h1>
        <FaseBadge fase={campeonato.fase_atual} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mx-4 mb-4 bg-card rounded-xl p-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex-1 py-2 rounded-lg text-xs font-semibold transition-colors',
              tab === t.key ? 'bg-primary text-black' : 'text-text-muted'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 pb-8">
        {tab === 'classificacao' && <TabClassificacao />}
        {tab === 'partidas'      && <TabPartidas />}
        {tab === 'destaques'     && <TabDestaques />}
      </div>
    </div>
  )
}

// ── Tab Classificação ──────────────────────────────────────
function TabClassificacao() {
  const { classificacaoA, classificacaoB, campeonato } = useCampeonato()

  if (campeonato?.fase_atual !== 'grupos') {
    return (
      <div className="space-y-4">
        <TabelaGrupo label="Grupo A" times={classificacaoA} />
        <TabelaGrupo label="Grupo B" times={classificacaoB} />
        <ResultadosMataMataTabel />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <TabelaGrupo label="Grupo A" times={classificacaoA} />
      <TabelaGrupo label="Grupo B" times={classificacaoB} />
    </div>
  )
}

function TabelaGrupo({ label, times }) {
  return (
    <div className="bg-card rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{label}</span>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-text-muted border-b border-border">
            <th className="text-left px-4 py-2 font-semibold w-6">#</th>
            <th className="text-left px-2 py-2 font-semibold">Time</th>
            <th className="px-2 py-2 font-semibold">J</th>
            <th className="px-2 py-2 font-semibold">V</th>
            <th className="px-2 py-2 font-semibold">E</th>
            <th className="px-2 py-2 font-semibold">D</th>
            <th className="px-2 py-2 font-semibold">SG</th>
            <th className="px-2 py-2 font-semibold text-primary">P</th>
          </tr>
        </thead>
        <tbody>
          {times.map((t, i) => (
            <tr key={t.id} className={cn('border-b border-border/50 last:border-0', i < 2 && 'bg-primary/5')}>
              <td className="px-4 py-2.5">
                <span className={cn('text-[10px] font-bold', i < 2 ? 'text-primary' : 'text-text-muted')}>{i + 1}</span>
              </td>
              <td className="px-2 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: t.cor }} />
                  <span className="font-semibold text-text-main truncate max-w-[100px]">{t.nome}</span>
                </div>
              </td>
              <td className="px-2 py-2.5 text-center text-text-muted">{t.j}</td>
              <td className="px-2 py-2.5 text-center text-text-muted">{t.v}</td>
              <td className="px-2 py-2.5 text-center text-text-muted">{t.e}</td>
              <td className="px-2 py-2.5 text-center text-text-muted">{t.d}</td>
              <td className="px-2 py-2.5 text-center text-text-muted">{t.sg >= 0 ? `+${t.sg}` : t.sg}</td>
              <td className="px-2 py-2.5 text-center font-black text-text-main">{t.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[10px] text-text-muted px-4 py-2">Os 2 primeiros avançam às semifinais</p>
    </div>
  )
}

function ResultadosMataMataTabel() {
  const { partidas, times } = useCampeonato()
  const fases = ['semifinal', 'terceiro_lugar', 'final']
  const labels = { semifinal: 'Semifinais', terceiro_lugar: '3° Lugar', final: 'Final' }

  return fases.map(fase => {
    const ps = partidas.filter(p => p.fase === fase)
    if (ps.length === 0) return null
    return (
      <div key={fase} className="bg-card rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{labels[fase]}</span>
        </div>
        <div className="divide-y divide-border/50">
          {ps.map(p => <PartidaRow key={p.id} partida={p} />)}
        </div>
      </div>
    )
  })
}

// ── Tab Partidas ──────────────────────────────────────────
function TabPartidas() {
  const { partidas } = useCampeonato()
  const { isAdmin } = useAuth()
  const navigate = useNavigate()

  const grupos = partidas.filter(p => p.fase === 'grupos')
  const mataEmMata = partidas.filter(p => p.fase !== 'grupos')
  const rodadas = [...new Set(grupos.map(p => p.rodada_num))].sort((a, b) => a - b)

  function handlePress(p) {
    if (p.status === 'agendada' && isAdmin) {
      navigate('/admin/campeonato/controle', { state: { partidaId: p.id } })
    } else if (p.status !== 'agendada') {
      navigate(`/campeonato/partida/${p.id}`)
    }
  }

  const canPress = (p) => p.status !== 'agendada' || isAdmin

  return (
    <div className="space-y-4">
      {rodadas.map(r => (
        <div key={r} className="bg-card rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Rodada {r}</span>
          </div>
          <div className="divide-y divide-border/50">
            {grupos.filter(p => p.rodada_num === r).map(p => (
              <PartidaRow key={p.id} partida={p} isAdmin={isAdmin} onPress={canPress(p) ? () => handlePress(p) : null} />
            ))}
          </div>
        </div>
      ))}

      {mataEmMata.length > 0 && (
        <div className="bg-card rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">Mata-Mata</span>
          </div>
          <div className="divide-y divide-border/50">
            {mataEmMata.map(p => (
              <PartidaRow key={p.id} partida={p} isAdmin={isAdmin} onPress={canPress(p) ? () => handlePress(p) : null} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PartidaRow({ partida: p, onPress, isAdmin }) {
  const encerrada = p.status === 'encerrada'
  const aoVivo = p.status === 'em_andamento'
  const agendadaAdmin = p.status === 'agendada' && isAdmin

  return (
    <button
      onClick={onPress}
      disabled={!onPress}
      className="w-full px-4 py-3 flex items-center gap-2 active:bg-white/5 disabled:cursor-default"
    >
      {aoVivo && (
        <span className="text-[9px] font-black text-danger uppercase tracking-wider animate-pulse mr-1">AO VIVO</span>
      )}
      {agendadaAdmin && (
        <span className="text-[9px] font-black text-primary uppercase tracking-wider mr-1">▶</span>
      )}
      <div className="flex-1 flex items-center justify-between gap-2">
        <span className={cn('text-sm font-semibold flex-1 text-right', encerrada ? 'text-text-main' : 'text-text-muted')}>{p.time_casa?.nome}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          {encerrada ? (
            <>
              <span className="text-base font-black text-text-main w-5 text-center">{p.gols_casa}</span>
              <span className="text-text-muted text-xs">–</span>
              <span className="text-base font-black text-text-main w-5 text-center">{p.gols_visitante}</span>
            </>
          ) : (
            <span className="text-xs text-text-muted px-2">vs</span>
          )}
        </div>
        <span className={cn('text-sm font-semibold flex-1', encerrada ? 'text-text-main' : 'text-text-muted')}>{p.time_visitante?.nome}</span>
      </div>
      {p.penaltis_casa != null && (
        <span className="text-[10px] text-secondary font-semibold ml-1">({p.penaltis_casa}–{p.penaltis_visitante} pen)</span>
      )}
    </button>
  )
}

// ── Tab Destaques ──────────────────────────────────────────
function TabDestaques() {
  const { estatisticas, partidas } = useCampeonato()
  const { artilheiro, garcom } = estatisticas

  const mvps = partidas
    .filter(p => p.mvp && p.status === 'encerrada')
    .map(p => ({ partida: p, mvp: p.mvp }))

  return (
    <div className="space-y-4">
      {/* Artilheiro */}
      <div className="bg-card rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <span className="text-secondary text-base">⚽</span>
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Artilheiro</span>
        </div>
        {artilheiro.length === 0
          ? <p className="text-text-muted text-sm px-4 py-4">Nenhum gol registrado.</p>
          : artilheiro.slice(0, 5).map((a, i) => <DestaqueLinha key={a.profile.id} rank={i + 1} profile={a.profile} total={a.total} label="gol" />)
        }
      </div>

      {/* Garçom */}
      <div className="bg-card rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <span className="text-secondary text-base">🎩</span>
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Garçom</span>
        </div>
        {garcom.length === 0
          ? <p className="text-text-muted text-sm px-4 py-4">Nenhuma assistência registrada.</p>
          : garcom.slice(0, 5).map((a, i) => <DestaqueLinha key={a.profile.id} rank={i + 1} profile={a.profile} total={a.total} label="assist" />)
        }
      </div>

      {/* MVPs */}
      <div className="bg-card rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Star size={14} className="text-secondary" />
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">MVPs das Partidas</span>
        </div>
        {mvps.length === 0
          ? <p className="text-text-muted text-sm px-4 py-4">Nenhuma votação encerrada ainda.</p>
          : mvps.map(({ partida, mvp }) => (
            <div key={partida.id} className="px-4 py-3 flex items-center gap-3 border-b border-border/50 last:border-0">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-elevated flex items-center justify-center shrink-0">
                {mvp.foto_url
                  ? <img src={mvp.foto_url} alt={mvp.nome} className="w-full h-full object-contain" />
                  : <User size={14} className="text-text-muted" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-main truncate">{mvp.nome}</p>
                <p className="text-xs text-text-muted">{partida.time_casa?.nome} {partida.gols_casa}–{partida.gols_visitante} {partida.time_visitante?.nome}</p>
              </div>
              <Star size={12} className="text-secondary shrink-0" />
            </div>
          ))
        }
      </div>
    </div>
  )
}

function DestaqueLinha({ rank, profile, total, label }) {
  return (
    <div className="px-4 py-3 flex items-center gap-3 border-b border-border/50 last:border-0">
      <span className={cn('text-sm font-black w-5 text-center', rank === 1 ? 'text-secondary' : 'text-text-muted')}>{rank}</span>
      <div className="w-8 h-8 rounded-full overflow-hidden bg-elevated flex items-center justify-center shrink-0">
        {profile.foto_url
          ? <img src={profile.foto_url} alt={profile.nome} className="w-full h-full object-contain" />
          : <User size={14} className="text-text-muted" />
        }
      </div>
      <span className="text-sm font-semibold text-text-main flex-1 truncate">{profile.nome}</span>
      <span className="text-sm font-black text-primary">{total}</span>
    </div>
  )
}

function FaseBadge({ fase }) {
  const map = {
    grupos:     { label: 'Fase de Grupos',  color: 'bg-primary/15 text-primary' },
    semifinais: { label: 'Semifinais',       color: 'bg-secondary/15 text-secondary' },
    final:      { label: 'Final',            color: 'bg-danger/15 text-danger' },
    encerrado:  { label: 'Encerrado',        color: 'bg-border text-text-muted' },
  }
  const { label, color } = map[fase] ?? { label: fase, color: 'bg-border text-text-muted' }
  return (
    <span className={cn('inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1', color)}>
      {label}
    </span>
  )
}
