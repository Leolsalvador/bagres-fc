import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, ChevronDown, Eye, EyeOff, Trophy, Play, Users, Shuffle, X } from 'lucide-react'
import { cn, teamDotStyle } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { generateCrossGroupSchedule, calcularClassificacao } from '@/lib/roundRobin'
import { useCampeonato } from '@/context/CampeonatoContext'

const CORES = ['#EF4444','#3B82F6','#F59E0B','#8B5CF6','#EC4899','#10B981','#F97316','#06B6D4','#FFFFFF','#000000']

// ── Linha de swatches de cor — usada na criação e edição de times ──
function ColorSwatchRow({ value, onChange, allowClear = false }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {allowClear && (
        <button
          onClick={() => onChange(null)}
          title="Sem cor secundária"
          className={cn(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0',
            !value ? 'border-white' : 'border-border'
          )}
        >
          <X size={11} className="text-text-muted" />
        </button>
      )}
      {CORES.map(c => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={cn(
            'w-6 h-6 rounded-full border-2 transition-transform shrink-0',
            value === c ? 'border-white scale-110' : 'border-transparent'
          )}
          style={{ background: c }}
        />
      ))}
    </div>
  )
}

export default function GestaoCampeonato() {
  const { profile } = useAuth()
  const { partidas, refresh } = useCampeonato()
  const [saving, setSaving] = useState(false)
  const [nome, setNome] = useState('')
  const [showForm, setShowForm] = useState(false)

  // Busca campeonato e times diretamente (sem filtro de visível)
  const [adminCamp, setAdminCamp] = useState(undefined)
  const [adminTimes, setAdminTimes] = useState([])

  const loadAdminTimes = useCallback(async (campId) => {
    if (!campId) return
    const { data } = await supabase.from('campeonato_times').select('*').eq('campeonato_id', campId)
    setAdminTimes(data ?? [])
  }, [])

  useEffect(() => {
    supabase.from('campeonatos').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => {
        setAdminCamp(data ?? null)
        if (data?.id) loadAdminTimes(data.id)
      })
  }, [loadAdminTimes])

  const campeonato = adminCamp

  async function criarCampeonato() {
    if (!nome.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('campeonatos').insert({
      nome: nome.trim(),
      status: 'rascunho',
      visivel: false,
      created_by: profile.id,
    }).select().single()
    if (!error) { setNome(''); setShowForm(false); setAdminCamp(data); refresh() }
    setSaving(false)
  }

  async function reloadCamp() {
    const { data } = await supabase.from('campeonatos').select('*').eq('id', campeonato.id).maybeSingle()
    if (data) setAdminCamp(data)
  }

  async function toggleVisivel() {
    if (!campeonato?.id) return
    const { error } = await supabase.from('campeonatos').update({ visivel: !campeonato.visivel }).eq('id', campeonato.id)
    if (error) { alert('Erro: ' + error.message); return }
    await reloadCamp()
    refresh()
  }

  async function iniciarCampeonato() {
    if (!campeonato?.id) return
    const { error } = await supabase.from('campeonatos').update({ status: 'em_andamento' }).eq('id', campeonato.id)
    if (error) { alert('Erro ao iniciar: ' + error.message); return }
    await reloadCamp()
    refresh()
  }

  async function avancarFase() {
    if (!campeonato?.id) return
    const proxima = { grupos: 'semifinais', semifinais: 'final', final: 'encerrado' }
    const fase = proxima[campeonato.fase_atual]
    if (!fase) return

    setSaving(true)
    if (fase === 'semifinais') await gerarPartidasMataEmMata()
    const { error } = await supabase.from('campeonatos').update({ fase_atual: fase }).eq('id', campeonato.id)
    if (error) { alert('Erro ao avançar fase: ' + error.message); setSaving(false); return }
    await reloadCamp()
    refresh()
    setSaving(false)
  }

  async function resetarCampeonato() {
    if (!campeonato?.id) return
    if (!window.confirm('Resetar campeonato para Rascunho e apagar todas as partidas?')) return
    setSaving(true)
    await supabase.from('campeonato_partidas').delete().eq('campeonato_id', campeonato.id)
    const { error } = await supabase.from('campeonatos').update({ status: 'rascunho', fase_atual: 'grupos' }).eq('id', campeonato.id)
    if (error) { alert('Erro ao resetar: ' + error.message); setSaving(false); return }
    await reloadCamp()
    refresh()
    setSaving(false)
  }

  async function excluirCampeonato() {
    if (!campeonato?.id) return
    if (!window.confirm(`Excluir "${campeonato.nome}" permanentemente? Isso remove times, partidas, eventos e votos. Não pode ser desfeito.`)) return
    setSaving(true)
    const { error } = await supabase.from('campeonatos').delete().eq('id', campeonato.id)
    if (error) { alert('Erro ao excluir: ' + error.message); setSaving(false); return }
    setAdminCamp(null)
    setAdminTimes([])
    refresh()
    setSaving(false)
  }

  async function gerarPartidasMataEmMata() {
    const grupoA = adminTimes.filter(t => t.grupo === 'A')
    const grupoB = adminTimes.filter(t => t.grupo === 'B')

    const classiA = calcularClassificacao(grupoA, partidas)
    const classiB = calcularClassificacao(grupoB, partidas)

    const [p1A, p2A] = classiA
    const [p1B, p2B] = classiB

    // 1° A × 2° B e 1° B × 2° A
    await supabase.from('campeonato_partidas').insert([
      { campeonato_id: campeonato.id, fase: 'semifinal', rodada_num: 1, ordem: 1, time_casa_id: p1A.id, time_visitante_id: p2B.id },
      { campeonato_id: campeonato.id, fase: 'semifinal', rodada_num: 1, ordem: 2, time_casa_id: p1B.id, time_visitante_id: p2A.id },
    ])
  }

  async function gerarTabela() {
    if (!campeonato) return
    const grupoA = adminTimes.filter(t => t.grupo === 'A')
    const grupoB = adminTimes.filter(t => t.grupo === 'B')
    if (grupoA.length === 0 || grupoB.length === 0) return alert('Adicione times nos dois grupos antes de gerar.')

    setSaving(true)
    // Remove partidas de grupos existentes
    await supabase.from('campeonato_partidas')
      .delete()
      .eq('campeonato_id', campeonato.id)
      .eq('fase', 'grupos')

    const schedule = generateCrossGroupSchedule(grupoA, grupoB)
    await supabase.from('campeonato_partidas').insert(
      schedule.map(m => ({
        campeonato_id: campeonato.id,
        fase: m.fase,
        rodada_num: m.rodadaNum,
        ordem: m.ordem,
        time_casa_id: m.timeCasaId,
        time_visitante_id: m.timeVisitanteId,
      }))
    )
    refresh()
    setSaving(false)
  }

  if (adminCamp === undefined) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="px-4 pt-10 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-text-main uppercase tracking-widest">Campeonato</h1>
          <p className="text-text-muted text-sm mt-0.5">Gestão e configuração</p>
        </div>
        {!campeonato && (
          <button
            onClick={() => setShowForm(true)}
            className="w-10 h-10 bg-primary rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-lg shadow-primary/30"
          >
            <Plus size={20} className="text-black" />
          </button>
        )}
      </div>

      {/* Form criar campeonato */}
      {showForm && !campeonato && (
        <div className="mx-4 mb-4 bg-card rounded-2xl p-4 space-y-3">
          <p className="text-text-main font-bold text-sm">Novo Campeonato</p>
          <input
            type="text" placeholder="Nome do campeonato" value={nome}
            onChange={e => setNome(e.target.value)}
            className="w-full bg-input text-text-main placeholder-text-muted rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary text-base"
          />
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-text-muted bg-elevated">Cancelar</button>
            <button onClick={criarCampeonato} disabled={saving || !nome.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-black bg-primary disabled:opacity-50">Criar</button>
          </div>
        </div>
      )}

      {!campeonato && !showForm && (
        <div className="flex flex-col items-center py-16 text-text-muted gap-3 px-8">
          <Trophy size={40} className="opacity-20" />
          <p className="text-sm text-center">Nenhum campeonato visível. Crie um para começar.</p>
        </div>
      )}

      {campeonato && (
        <div className="px-4 space-y-4 pb-8">
          {/* Status card */}
          <div className="bg-card rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Trophy size={24} className="text-secondary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-text-main font-bold truncate">{campeonato.nome}</p>
                <p className="text-text-muted text-xs capitalize">{campeonato.status} · {campeonato.fase_atual}</p>
              </div>
            </div>
            {/* Botão de habilitar/desabilitar Copa para todos */}
            <button
              onClick={toggleVisivel}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-colors active:scale-95 transition-transform',
                campeonato.visivel
                  ? 'bg-danger/10 text-danger border border-danger/20'
                  : 'bg-primary text-black'
              )}
            >
              {campeonato.visivel ? <EyeOff size={15} /> : <Eye size={15} />}
              {campeonato.visivel ? 'Desabilitar aba Copa para todos' : 'Habilitar aba Copa para todos'}
            </button>
          </div>

          {/* Ações */}
          <div className="grid grid-cols-2 gap-2">
            {campeonato.status === 'rascunho' && (
              <button onClick={iniciarCampeonato} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/10 text-primary text-sm font-bold active:scale-95 transition-transform">
                <Play size={15} /> Iniciar
              </button>
            )}
            {campeonato.status === 'em_andamento' && campeonato.fase_atual !== 'encerrado' && (
              <button onClick={avancarFase} disabled={saving} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary/10 text-secondary text-sm font-bold active:scale-95 transition-transform disabled:opacity-50 col-span-1">
                Avançar fase
              </button>
            )}
            <button onClick={gerarTabela} disabled={saving} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-elevated text-text-muted text-sm font-semibold active:scale-95 transition-transform disabled:opacity-50">
              <Shuffle size={15} /> Gerar tabela
            </button>
            {campeonato.status !== 'rascunho' && (
              <button onClick={resetarCampeonato} disabled={saving} className="col-span-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-danger/10 text-danger text-sm font-semibold active:scale-95 transition-transform disabled:opacity-50">
                Resetar para Rascunho
              </button>
            )}
            <button onClick={excluirCampeonato} disabled={saving} className="col-span-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-danger/20 text-danger text-sm font-bold active:scale-95 transition-transform disabled:opacity-50 border border-danger/30">
              <Trash2 size={15} /> Excluir campeonato
            </button>
          </div>

          {/* Times */}
          <GrupoEditor campeonatoId={campeonato.id} grupo="A" times={adminTimes.filter(t => t.grupo === 'A')} onRefresh={() => loadAdminTimes(campeonato.id)} />
          <GrupoEditor campeonatoId={campeonato.id} grupo="B" times={adminTimes.filter(t => t.grupo === 'B')} onRefresh={() => loadAdminTimes(campeonato.id)} />

          {/* Preview da tabela */}
          {partidas.filter(p => p.fase === 'grupos').length > 0 && (
            <div className="bg-card rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Tabela de jogos gerada</span>
              </div>
              <div className="divide-y divide-border/50">
                {partidas.filter(p => p.fase === 'grupos').map((p, i) => (
                  <div key={p.id} className="px-4 py-2.5 flex items-center gap-2 text-sm">
                    <span className="text-text-muted text-xs w-4 text-center">{p.ordem}</span>
                    <span className="flex-1 text-right text-text-main font-medium truncate">{p.time_casa?.nome}</span>
                    <span className="text-text-muted text-xs px-1">vs</span>
                    <span className="flex-1 text-text-main font-medium truncate">{p.time_visitante?.nome}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Editor de times por grupo ──────────────────────────────
function GrupoEditor({ campeonatoId, grupo, times, onRefresh }) {
  const [showAddTime, setShowAddTime] = useState(false)
  const [nomeTime, setNomeTime] = useState('')
  const [cor, setCor] = useState(CORES[0])
  const [corSecundaria, setCorSecundaria] = useState(null)
  const [saving, setSaving] = useState(false)

  async function addTime() {
    if (!nomeTime.trim()) return
    setSaving(true)
    await supabase.from('campeonato_times').insert({ campeonato_id: campeonatoId, nome: nomeTime.trim(), cor, cor_secundaria: corSecundaria, grupo })
    setNomeTime(''); setCorSecundaria(null); setShowAddTime(false); onRefresh()
    setSaving(false)
  }

  async function removeTime(id) {
    await supabase.from('campeonato_times').delete().eq('id', id)
    onRefresh()
  }

  return (
    <div className="bg-card rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Grupo {grupo}</span>
        <button onClick={() => setShowAddTime(v => !v)} className="text-primary text-xs font-semibold flex items-center gap-1">
          <Plus size={13} /> Time
        </button>
      </div>

      {showAddTime && (
        <div className="px-4 py-3 border-b border-border space-y-3">
          <input
            type="text" placeholder="Nome do time" value={nomeTime}
            onChange={e => setNomeTime(e.target.value)}
            className="w-full bg-input text-text-main placeholder-text-muted rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-sm"
          />
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Cor principal</p>
            <ColorSwatchRow value={cor} onChange={setCor} />
          </div>
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Cor secundária (opcional)</p>
            <ColorSwatchRow value={corSecundaria} onChange={setCorSecundaria} allowClear />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAddTime(false)} className="flex-1 py-2 rounded-xl text-xs font-semibold text-text-muted bg-elevated">Cancelar</button>
            <button onClick={addTime} disabled={saving || !nomeTime.trim()} className="flex-1 py-2 rounded-xl text-xs font-bold text-black bg-primary disabled:opacity-50">Adicionar</button>
          </div>
        </div>
      )}

      {times.length === 0 && <p className="text-text-muted text-xs px-4 py-3">Nenhum time no Grupo {grupo}.</p>}

      <div className="divide-y divide-border/50">
        {times.map(t => (
          <TimeRow key={t.id} time={t} campeonatoId={campeonatoId} onRemove={() => removeTime(t.id)} onRefresh={onRefresh} />
        ))}
      </div>
    </div>
  )
}

// ── Linha de time expansível ──────────────────────────────
function TimeRow({ time, campeonatoId, onRemove, onRefresh }) {
  const [open, setOpen] = useState(false)
  const [jogadoresTimes, setJogadoresTimes] = useState([])
  const [allProfiles, setAllProfiles] = useState([])
  const [loading, setLoading] = useState(false)

  const [showAddPanel, setShowAddPanel] = useState(false)
  const [search, setSearch] = useState('')
  const [allAllocated, setAllAllocated] = useState(new Set())
  const [showColorPicker, setShowColorPicker] = useState(false)

  async function load() {
    setLoading(true)
    const { data: allTeams } = await supabase.from('campeonato_times').select('id').eq('campeonato_id', campeonatoId)
    const allTeamIds = (allTeams ?? []).map(t => t.id)

    const [{ data: jt }, { data: profiles }, { data: allocated }] = await Promise.all([
      supabase.from('campeonato_time_jogadores').select('jogador_id, profiles(id, nome)').eq('time_id', time.id),
      supabase.from('profiles').select('id, nome').eq('status', 'aprovado').order('nome'),
      allTeamIds.length > 0
        ? supabase.from('campeonato_time_jogadores').select('jogador_id').in('time_id', allTeamIds)
        : Promise.resolve({ data: [] }),
    ])
    setJogadoresTimes(jt ?? [])
    setAllProfiles(profiles ?? [])
    setAllAllocated(new Set((allocated ?? []).map(a => a.jogador_id)))
    setLoading(false)
  }

  function toggle() {
    if (!open) load()
    setOpen(v => !v)
  }

  async function addJogador(jogadorId) {
    await supabase.from('campeonato_time_jogadores').insert({ time_id: time.id, jogador_id: jogadorId })
    load(); onRefresh()
  }

  async function removeJogador(jogadorId) {
    await supabase.from('campeonato_time_jogadores').delete().eq('time_id', time.id).eq('jogador_id', jogadorId)
    load(); onRefresh()
  }

  async function updateCor(field, value) {
    await supabase.from('campeonato_times').update({ [field]: value }).eq('id', time.id)
    onRefresh()
  }

  const inscritos = new Set(jogadoresTimes.map(j => j.jogador_id))
  const inscritosCount = jogadoresTimes.length

  return (
    <div>
      {/* Cabeçalho do time — clicável */}
      <button onClick={toggle} className="w-full px-4 py-3 flex items-center gap-3 active:bg-white/5 transition-colors">
        <button
          onClick={e => { e.stopPropagation(); setShowColorPicker(v => !v) }}
          className="w-5 h-5 rounded-full shrink-0 ring-2 ring-offset-2 ring-offset-card ring-transparent active:ring-white/30 transition-all"
          style={teamDotStyle(time)}
        />
        <span className="text-sm font-semibold text-text-main flex-1 text-left">{time.nome}</span>
        <span className="text-xs text-text-muted flex items-center gap-1 shrink-0">
          <Users size={11} /> {inscritosCount}
        </span>
        <ChevronDown size={14} className={cn('text-text-muted transition-transform shrink-0', open && 'rotate-180')} />
        <button
          onClick={e => { e.stopPropagation(); onRemove() }}
          className="p-1.5 rounded-lg bg-danger/10 text-danger active:scale-95 shrink-0"
        >
          <Trash2 size={13} />
        </button>
      </button>

      {/* Seletor de cor */}
      {showColorPicker && (
        <div className="px-4 py-3 border-t border-border/50 bg-background/40 space-y-3">
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Cor principal</p>
            <ColorSwatchRow value={time.cor} onChange={c => updateCor('cor', c)} />
          </div>
          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Cor secundária (opcional)</p>
            <ColorSwatchRow value={time.cor_secundaria} onChange={c => updateCor('cor_secundaria', c)} allowClear />
          </div>
        </div>
      )}

      {/* Lista de jogadores expansível */}
      {open && (
        <div className="border-t border-border/50 bg-background/40">
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Jogadores já no time */}
              <div className="divide-y divide-border/30">
                {jogadoresTimes.length === 0 && (
                  <p className="text-text-muted text-xs px-5 py-3">Nenhum jogador no time.</p>
                )}
                {jogadoresTimes.map(jt => (
                  <div key={jt.jogador_id} className="flex items-center px-5 py-2.5 gap-3">
                    <span className="text-sm text-text-main font-medium flex-1">{jt.profiles?.nome ?? '—'}</span>
                    <button onClick={() => removeJogador(jt.jogador_id)} className="text-xs text-danger font-semibold px-2 py-1 rounded-lg bg-danger/10">Remover</button>
                  </div>
                ))}
              </div>

              {/* Botão para adicionar jogadores */}
              <div className="px-5 py-2.5 border-t border-border/30">
                <button
                  onClick={() => { setShowAddPanel(v => !v); setSearch('') }}
                  className="text-xs text-primary font-semibold flex items-center gap-1"
                >
                  <Plus size={12} /> {showAddPanel ? 'Fechar' : 'Adicionar jogador'}
                </button>
              </div>

              {/* Painel de adição com busca */}
              {showAddPanel && (
                <div className="border-t border-border/30">
                  <div className="px-5 py-2">
                    <input
                      type="text"
                      placeholder="Buscar jogador..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full bg-elevated text-text-main placeholder-text-muted rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="divide-y divide-border/30 max-h-48 overflow-y-auto">
                    {allProfiles
                      .filter(p => !allAllocated.has(p.id))
                      .filter(p => p.nome.toLowerCase().includes(search.toLowerCase()))
                      .map(p => (
                        <div key={p.id} className="flex items-center px-5 py-2.5 gap-3">
                          <span className="text-sm text-text-muted flex-1">{p.nome}</span>
                          <button onClick={() => addJogador(p.id)} className="text-xs text-primary font-semibold px-2 py-1 rounded-lg bg-primary/10">Adicionar</button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
