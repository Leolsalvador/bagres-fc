// src/lib/api.js — Todas as queries do Supabase
import { supabase } from './supabase'
import {
  USE_MOCK,
  mockCurrentUser, mockPlayers, mockRodada, mockPresencas,
  mockRodadasHistory, mockCiclo,
} from './mockData'

// ─── PUSH NOTIFICATIONS ─────────────────────────────────────
export async function sendPushNotification({ title, body, userIds }) {
  if (USE_MOCK) {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icons/icon-192.png' })
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') new Notification(title, { body, icon: '/icons/icon-192.png' })
      })
    }
    return
  }
  const { data, error } = await supabase.functions.invoke('send-push', {
    body: { title, body, userIds },
  })
  if (error) console.error('sendPushNotification error:', error)
  else console.log('sendPushNotification result:', data)
}

// ─── HELPERS ────────────────────────────────────────────────
function nextMonday() {
  const d = new Date()
  const daysUntil = (8 - d.getDay()) % 7 || 7
  d.setDate(d.getDate() + daysUntil)
  return d.toISOString().split('T')[0]
}

const PROFILE_FIELDS = 'id, nome, foto_url, rating, gols, assistencias, jogos, papel, status, posicao_campo'

// ─── PROFILES ───────────────────────────────────────────────
export async function updateProfile(userId, { nome, foto_url, posicao_campo }) {
  const updates = {}
  if (nome !== undefined) updates.nome = nome
  if (foto_url !== undefined) updates.foto_url = foto_url
  if (posicao_campo !== undefined) updates.posicao_campo = posicao_campo
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
  if (error) throw error
}

export async function uploadAvatar(userId, file) {
  const ext = file.name.split('.').pop()
  const path = `${userId}/avatar.${ext}`
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true })
  if (uploadError) throw uploadError
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  // Cache-busting para forçar reload da imagem
  return `${data.publicUrl}?t=${Date.now()}`
}

export async function fetchAdminProfiles() {
  if (USE_MOCK) return [mockCurrentUser]
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_FIELDS)
    .eq('papel', 'admin')
    .eq('status', 'aprovado')
    .order('created_at')
  if (error) throw error
  return data ?? []
}

export async function fetchApprovedProfiles() {
  if (USE_MOCK) return mockPlayers.filter(p => p.status === 'aprovado')
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_FIELDS)
    .eq('status', 'aprovado')
    .order('rating', { ascending: false })
  if (error) throw error
  return data ?? []
}

// ─── RODADA ─────────────────────────────────────────────────
export async function fetchLatestRodada() {
  if (USE_MOCK) return mockRodada
  const { data, error } = await supabase
    .from('rodadas')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createRodada() {
  if (USE_MOCK) return { ...mockRodada, status: 'aguardando', id: 'mock-rodada-' + Date.now() }
  const { data, error } = await supabase
    .from('rodadas')
    .insert({ data_jogo: nextMonday(), status: 'aguardando' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateRodadaStatus(rodadaId, status, extra = {}) {
  if (USE_MOCK) return
  const { error } = await supabase
    .from('rodadas')
    .update({ status, ...extra })
    .eq('id', rodadaId)
  if (error) throw error
}

// ─── PRESENÇAS ──────────────────────────────────────────────
export async function fetchPresencas(rodadaId) {
  if (USE_MOCK) return mockPresencas
  const { data, error } = await supabase
    .from('presencas')
    .select(`*, profiles(${PROFILE_FIELDS})`)
    .eq('rodada_id', rodadaId)
    .order('posicao')
  if (error) throw error
  return data ?? []
}

export async function insertPresenca(rodadaId, usuarioId, posicao, status) {
  const { data, error } = await supabase
    .from('presencas')
    .insert({ rodada_id: rodadaId, usuario_id: usuarioId, posicao, status })
    .select(`*, profiles(${PROFILE_FIELDS})`)
    .single()
  if (error) throw error
  return data
}

export async function deletePresenca(presencaId) {
  const { error } = await supabase.from('presencas').delete().eq('id', presencaId)
  if (error) throw error
}

export async function deleteAllPresencas(rodadaId) {
  if (USE_MOCK) return
  const { error } = await supabase.from('presencas').delete().eq('rodada_id', rodadaId)
  if (error) throw error
}

export async function updatePresenca(presencaId, fields) {
  const { error } = await supabase.from('presencas').update(fields).eq('id', presencaId)
  if (error) throw error
}

// ─── TIMES (SORTEIO) ────────────────────────────────────────
export async function saveDrawToDb(rodadaId, teams) {
  // Remove times anteriores
  await supabase.from('times').delete().eq('rodada_id', rodadaId)

  const saved = []
  for (const team of teams) {
    const { data: t, error } = await supabase
      .from('times')
      .insert({ rodada_id: rodadaId, numero: team.numero, nome: team.nome })
      .select('id')
      .single()
    if (error) throw error

    await supabase.from('time_jogadores').insert(
      team.players.map(p => ({ time_id: t.id, usuario_id: p.id }))
    )
    saved.push({ ...team, id: t.id })
  }
  return saved
}

export async function fetchTeams(rodadaId) {
  if (USE_MOCK) return null
  const { data, error } = await supabase
    .from('times')
    .select(`id, numero, nome, time_jogadores(profiles(${PROFILE_FIELDS}))`)
    .eq('rodada_id', rodadaId)
    .order('numero')
  if (error) throw error
  if (!data?.length) return null

  return data.map(t => ({
    id: t.id,
    numero: t.numero,
    nome: t.nome,
    players: t.time_jogadores.map(tj => tj.profiles),
    ratingMedio: t.time_jogadores.reduce((s, tj) => s + (tj.profiles?.rating ?? 0), 0) / t.time_jogadores.length,
  }))
}

// ─── PARTIDAS ───────────────────────────────────────────────
export async function savePartida(rodadaId, teams, result) {
  const teamA = teams.find(t => t.nome === result.teamA.nome)
  const teamB = teams.find(t => t.nome === result.teamB.nome)
  if (!teamA?.id || !teamB?.id) throw new Error('IDs dos times não encontrados')

  const vencedorId = result.winner === 'A' ? teamA.id : result.winner === 'B' ? teamB.id : null

  const { data: partida, error: pErr } = await supabase
    .from('partidas')
    .insert({
      rodada_id: rodadaId,
      time_a_id: teamA.id,
      time_b_id: teamB.id,
      gols_a: result.goalsA,
      gols_b: result.goalsB,
      vencedor_id: vencedorId,
      status: 'encerrada',
    })
    .select('id')
    .single()
  if (pErr) throw pErr

  const events = result.events ?? []
  if (events.length > 0) {
    await supabase.from('eventos').insert(
      events.map(ev => ({
        partida_id: partida.id,
        usuario_id: ev.player.id,
        tipo: ev.type === 'gol' ? 'gol' : 'assistencia',
        minuto: ev.minute ?? null,
      }))
    )
  }

  // Atualiza gols e assistências via RPC (security definer contorna RLS)
  const statsMap = {}
  events.forEach(ev => {
    const id = ev.player.id
    if (!statsMap[id]) statsMap[id] = { gols: 0, assistencias: 0 }
    if (ev.type === 'gol') statsMap[id].gols++
    else statsMap[id].assistencias++
  })
  await Promise.all(
    Object.entries(statsMap).map(([uid, s]) =>
      supabase.rpc('increment_player_stats', {
        player_id: uid,
        gols_add: s.gols,
        assistencias_add: s.assistencias,
        jogos_add: 0,
      })
    )
  )
}

export async function fetchMatchHistory(rodadaId) {
  if (USE_MOCK) return []
  const { data, error } = await supabase
    .from('partidas')
    .select(`
      id, gols_a, gols_b, vencedor_id,
      time_a:time_a_id(id, nome),
      time_b:time_b_id(id, nome),
      eventos(usuario_id, tipo, minuto, profiles(id, nome, foto_url))
    `)
    .eq('rodada_id', rodadaId)
    .eq('status', 'encerrada')
    .order('created_at')
  if (error) throw error

  return (data ?? []).map(p => ({
    teamA: { nome: p.time_a.nome, players: [] },
    teamB: { nome: p.time_b.nome, players: [] },
    goalsA: p.gols_a,
    goalsB: p.gols_b,
    winner: !p.vencedor_id ? 'draw' : p.vencedor_id === p.time_a.id ? 'A' : 'B',
    events: (p.eventos ?? []).map(ev => ({
      type: ev.tipo,
      player: ev.profiles,
      team: 'A', // team não é crítico para o resumo
      minute: ev.minuto,
    })),
  }))
}

// ─── FINALIZAÇÃO DA RODADA ──────────────────────────────────
export async function finalizeRodada(rodadaId, matchHistory, presencas) {
  if (USE_MOCK) return
  // Computa artilheiro e garçom
  const allEvents = matchHistory.flatMap(m => m.events ?? [])
  const goalMap = {}, assistMap = {}
  allEvents.forEach(ev => {
    const key = ev.player?.id
    if (!key) return
    if (ev.type === 'gol') goalMap[key] = { id: key, count: (goalMap[key]?.count ?? 0) + 1 }
    else assistMap[key] = { id: key, count: (assistMap[key]?.count ?? 0) + 1 }
  })
  const artilheiro = Object.values(goalMap).sort((a, b) => b.count - a.count)[0]
  const garcom     = Object.values(assistMap).sort((a, b) => b.count - a.count)[0]

  await updateRodadaStatus(rodadaId, 'encerrada', {
    artilheiro_id: artilheiro?.id ?? null,
    garcom_id: garcom?.id ?? null,
  })

  // Incrementa jogos para os 20 da lista principal
  const lista = presencas.filter(p => p.posicao <= 20)
  await Promise.all(
    lista.map(p =>
      supabase.rpc('increment_player_stats', {
        player_id: p.usuario_id,
        gols_add: 0,
        assistencias_add: 0,
        jogos_add: 1,
      })
    )
  )
}

// ─── VOTAÇÃO ────────────────────────────────────────────────
export async function fetchLatestCiclo() {
  if (USE_MOCK) return mockCiclo
  const { data, error } = await supabase
    .from('ciclos_votacao')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createCiclo() {
  const { data, error } = await supabase
    .from('ciclos_votacao')
    .insert({ aberta: true })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCiclo(cicloId, aberta) {
  const { error } = await supabase
    .from('ciclos_votacao')
    .update({ aberta })
    .eq('id', cicloId)
  if (error) throw error
}

export async function saveVoto(cicloId, votanteId, avaliadoId, nota) {
  const { error } = await supabase
    .from('votos')
    .upsert({ ciclo_id: cicloId, votante_id: votanteId, avaliado_id: avaliadoId, nota })
  if (error) throw error

  // Tenta recalcular via RPC; se falhar, calcula e salva direto
  const { error: rpcError } = await supabase.rpc('recalculate_rating', { player_id: avaliadoId })
  if (rpcError) {
    console.error('recalculate_rating RPC error:', rpcError)
    // Fallback: calcula a média dos votos e salva direto
    const { data: votos } = await supabase
      .from('votos')
      .select('nota')
      .eq('avaliado_id', avaliadoId)
    if (votos?.length) {
      const avg = votos.reduce((s, v) => s + v.nota, 0) / votos.length
      await supabase.from('profiles').update({ rating: Math.round(avg * 100) / 100 }).eq('id', avaliadoId)
    }
  }
}

export async function fetchMyVotos(cicloId, votanteId) {
  if (USE_MOCK) return []
  const { data, error } = await supabase
    .from('votos')
    .select('avaliado_id, nota')
    .eq('ciclo_id', cicloId)
    .eq('votante_id', votanteId)
  if (error) throw error
  return data ?? []
}

// ─── HISTÓRICO DE RODADAS (Home) ────────────────────────────
export async function fetchRodadasEncerradas() {
  if (USE_MOCK) return mockRodadasHistory
  const { data, error } = await supabase
    .from('rodadas')
    .select(`
      id, data_jogo,
      artilheiro:artilheiro_id(nome),
      garcom:garcom_id(nome),
      partidas(
        gols_a, gols_b, vencedor_id,
        time_a:time_a_id(id, nome),
        time_b:time_b_id(id, nome)
      )
    `)
    .eq('status', 'encerrada')
    .order('data_jogo', { ascending: false })
    .limit(10)
  if (error) throw error

  return (data ?? []).map(r => ({
    id: r.id,
    data_jogo: r.data_jogo,
    artilheiro: r.artilheiro ? { nome: r.artilheiro.nome, gols: 0 } : null,
    garcom:     r.garcom     ? { nome: r.garcom.nome, assistencias: 0 } : null,
    timeDaRodada: computeTimeDaRodada(r.partidas ?? []),
    partidas: (r.partidas ?? []).map(p => ({
      teamA: p.time_a?.nome ?? '?',
      teamB: p.time_b?.nome ?? '?',
      goalsA: p.gols_a,
      goalsB: p.gols_b,
      winner: !p.vencedor_id ? 'draw' : p.vencedor_id === p.time_a?.id ? 'A' : 'B',
    })),
  }))
}

function computeTimeDaRodada(partidas) {
  const map = {}
  partidas.forEach(p => {
    const nA = p.time_a?.nome, nB = p.time_b?.nome
    if (!nA || !nB) return
    if (!map[nA]) map[nA] = { nome: nA, vitorias: 0, saldo: 0 }
    if (!map[nB]) map[nB] = { nome: nB, vitorias: 0, saldo: 0 }
    map[nA].saldo += p.gols_a - p.gols_b
    map[nB].saldo += p.gols_b - p.gols_a
    if (p.vencedor_id === p.time_a?.id) map[nA].vitorias++
    else if (p.vencedor_id === p.time_b?.id) map[nB].vitorias++
  })
  return Object.values(map).sort((a, b) => b.vitorias - a.vitorias || b.saldo - a.saldo)[0] ?? null
}
