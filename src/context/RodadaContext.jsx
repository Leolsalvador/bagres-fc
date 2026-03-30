import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import {
  fetchLatestRodada, createRodada,
  fetchPresencas, insertPresenca, insertGuestPresenca, deletePresenca, updatePresenca,
  updateRodadaStatus, finalizeRodada, deleteAllPresencas,
  saveDrawToDb, fetchTeams,
  savePartida, fetchMatchHistory,
  sendPushNotification, fetchAdminProfiles,
} from '@/lib/api'
import { drawTeams } from '@/lib/teamDraw'
import { supabase } from '@/lib/supabase'
import { USE_MOCK, mockPresencas } from '@/lib/mockData'

const RodadaContext = createContext(null)

export function RodadaProvider({ children }) {
  const [rodada, setRodada]             = useState(null)
  const [presencas, setPresencas]       = useState([])
  const [teams, setTeams]               = useState(null)
  const [matchHistory, setMatchHistory] = useState([])
  const [loading, setLoading]           = useState(true)
  const autoPromotingRef                = useRef(false)

  const votacaoRodadaAberta = rodada?.status === 'encerrada'

  // ── Auto-promoção: preenche spots disponíveis da fila ────
  useEffect(() => {
    if (autoPromotingRef.current || !rodada || rodada.status !== 'aberta') return

    const lista = presencas.filter(p => p.posicao <= 20)
    const fila  = presencas.filter(p => p.posicao > 20 && p.posicao < 100).sort((a, b) => a.posicao - b.posicao)
    const spots = 20 - lista.length
    if (spots <= 0 || fila.length === 0) return

    const takenPos = new Set(lista.map(p => p.posicao))
    const freePositions = []
    for (let i = 1; i <= 20 && freePositions.length < Math.min(spots, fila.length); i++) {
      if (!takenPos.has(i)) freePositions.push(i)
    }
    const toPromote = fila.slice(0, freePositions.length)
    if (toPromote.length === 0) return

    autoPromotingRef.current = true

    setPresencas(ps => ps.map(p => {
      const idx = toPromote.findIndex(pr => pr.id === p.id)
      return idx !== -1 ? { ...p, posicao: freePositions[idx], status: 'confirmado' } : p
    }))

    toPromote.reduce((chain, promoted, i) =>
      chain.then(() => updatePresenca(promoted.id, { posicao: freePositions[i], status: 'confirmado' })),
      Promise.resolve()
    )
      .then(() => { autoPromotingRef.current = false })
      .catch(err => { console.error('Erro ao promover da fila:', err); autoPromotingRef.current = false })

    sendPushNotification({
      title: '🎉 Você entrou na lista!',
      body: 'Uma vaga abriu e você foi promovido da fila de espera.',
      userIds: toPromote.map(p => p.usuario_id).filter(Boolean),
    }).catch(console.error)
  }, [presencas, rodada])

  // ── Busca inicial ────────────────────────────────────────
  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetchLatestRodada()
      setRodada(r)
      if (!r) { setLoading(false); return }

      const [ps, ts, mh] = await Promise.all([
        fetchPresencas(r.id),
        ['sorteada', 'em_jogo', 'encerrada'].includes(r.status) ? fetchTeams(r.id) : Promise.resolve(null),
        ['em_jogo', 'encerrada'].includes(r.status) ? fetchMatchHistory(r.id) : Promise.resolve([]),
      ])
      setPresencas(ps)
      setTeams(ts)
      setMatchHistory(mh)
    } catch (err) {
      console.error('Erro ao carregar rodada:', err)
    }
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  // ── Realtime: sincroniza com outros clientes ──────────────
  useEffect(() => {
    if (USE_MOCK || !rodada?.id) return

    const channel = supabase
      .channel(`rodada-${rodada.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rodadas',  filter: `id=eq.${rodada.id}` },        () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presencas', filter: `rodada_id=eq.${rodada.id}` }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'times',     filter: `rodada_id=eq.${rodada.id}` }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partidas',  filter: `rodada_id=eq.${rodada.id}` }, () => refresh())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [rodada?.id, refresh])

  // ── Status da rodada ─────────────────────────────────────
  async function setStatus(status) {
    if (!rodada) return
    setRodada(r => ({ ...r, status })) // optimistic
    if (USE_MOCK && status === 'aberta') {
      setPresencas(mockPresencas)
      return
    }
    try {
      if (status === 'encerrada') {
        await finalizeRodada(rodada.id, matchHistory, presencas)
      } else {
        await updateRodadaStatus(rodada.id, status)
      }
      if (status === 'aberta') {
        // Insere admins na lista — ignora se já estiverem (unique constraint)
        const admins = await fetchAdminProfiles()
        const adminPresencas = []
        for (let i = 0; i < admins.length; i++) {
          try {
            const p = await insertPresenca(rodada.id, admins[i].id, i + 1, 'confirmado')
            adminPresencas.push(p)
          } catch {
            // admin já está na lista, ignora
          }
        }
        if (adminPresencas.length > 0) setPresencas(adminPresencas)
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
    }

    // Notificação fora do try/catch — dispara independente de erros anteriores
    if (status === 'aberta') {
      sendPushNotification({ title: '⚽ Lista aberta!', body: 'A lista da rodada está aberta. Confirme sua presença!' })
    }
  }

  async function closeList() {
    if (!rodada) return
    setRodada(r => ({ ...r, status: 'aguardando' }))
    setPresencas([])
    try {
      await deleteAllPresencas(rodada.id)
      await updateRodadaStatus(rodada.id, 'aguardando')
    } catch (err) {
      console.error('Erro ao fechar lista:', err)
    }
  }

  async function clearPresencas() {
    if (!rodada) return
    setPresencas([])
    try {
      await deleteAllPresencas(rodada.id)
    } catch (err) {
      console.error('Erro ao limpar lista:', err)
    }
  }

  async function createNovaRodada() {
    try {
      const r = await createRodada()
      setRodada(r)
      setPresencas([])
      setTeams(null)
      setMatchHistory([])
    } catch (err) {
      console.error('Erro ao criar rodada:', err)
    }
  }

  // ── Presenças: ações do jogador ──────────────────────────
  async function joinList(userId, profile) {
    if (!rodada) return

    // Goleiros entram numa faixa separada (100+) e são sempre confirmados
    const isGol = profile?.posicao_campo === 'GOL'
    if (isGol) {
      const goleiros = presencas.filter(p => p.posicao >= 100)
      const maxGol   = goleiros.length > 0 ? Math.max(...goleiros.map(p => p.posicao)) : 99
      const posicao  = maxGol + 1
      const temp = { id: `temp-${userId}`, rodada_id: rodada.id, usuario_id: userId, posicao, status: 'confirmado', profiles: profile }
      setPresencas(ps => [...ps, temp])
      try {
        const real = await insertPresenca(rodada.id, userId, posicao, 'confirmado')
        setPresencas(ps => ps.map(p => p.id === temp.id ? real : p))
      } catch (err) {
        setPresencas(ps => ps.filter(p => p.id !== temp.id))
        console.error('Erro ao entrar na lista:', err)
      }
      return
    }

    const lista = presencas.filter(p => p.posicao <= 20)
    const fila  = presencas.filter(p => p.posicao > 20 && p.posicao < 100)
    const isQueue = lista.length >= 20
    const maxLista = lista.length > 0 ? Math.max(...lista.map(p => p.posicao)) : 0
    const maxFila  = fila.length  > 0 ? Math.max(...fila.map(p => p.posicao))  : 20
    const posicao = isQueue ? maxFila + 1 : maxLista + 1
    const status  = isQueue ? 'espera' : 'confirmado'

    // Optimistic
    const temp = { id: `temp-${userId}`, rodada_id: rodada.id, usuario_id: userId, posicao, status, profiles: profile }
    setPresencas(ps => [...ps, temp])

    try {
      const real = await insertPresenca(rodada.id, userId, posicao, status)
      setPresencas(ps => ps.map(p => p.id === temp.id ? real : p))
    } catch (err) {
      setPresencas(ps => ps.filter(p => p.id !== temp.id))
      console.error('Erro ao entrar na lista:', err)
    }
  }

  async function addGuest(userId, profile, { nome, posicao_campo, rating }) {
    if (!rodada) return

    const lista = presencas.filter(p => p.posicao <= 20)
    const fila  = presencas.filter(p => p.posicao > 20 && p.posicao < 100)
    const isQueue  = lista.length >= 20
    const maxLista = lista.length > 0 ? Math.max(...lista.map(p => p.posicao)) : 0
    const maxFila  = fila.length  > 0 ? Math.max(...fila.map(p => p.posicao))  : 20
    const posicao  = isQueue ? maxFila + 1 : maxLista + 1
    const status   = isQueue ? 'espera' : 'confirmado'

    const temp = {
      id: `temp-guest-${Date.now()}`,
      rodada_id: rodada.id,
      usuario_id: null,
      posicao,
      status,
      is_guest: true,
      guest_nome: nome,
      guest_posicao_campo: posicao_campo,
      guest_rating: rating,
      convidado_por: userId,
      profiles: null,
      inviter: { id: userId, nome: profile.nome },
    }
    setPresencas(ps => [...ps, temp])

    try {
      const real = await insertGuestPresenca(rodada.id, { nome, posicao_campo, rating }, posicao, userId)
      setPresencas(ps => ps.map(p => p.id === temp.id ? real : p))
    } catch (err) {
      setPresencas(ps => ps.filter(p => p.id !== temp.id))
      console.error('Erro ao adicionar convidado:', err)
    }
  }

  async function leaveList(userId) {
    const removed = presencas.find(p => p.usuario_id === userId)
    if (!removed) return

    // Optimistic
    let updated = presencas.filter(p => p.usuario_id !== userId)
    if (removed.posicao <= 20) {
      const filaOrdenada = updated.filter(p => p.posicao > 20 && p.posicao < 100).sort((a, b) => a.posicao - b.posicao)
      if (filaOrdenada.length > 0) {
        const promoted = filaOrdenada[0]
        updated = updated.map(p =>
          p.id === promoted.id ? { ...p, posicao: removed.posicao, status: 'confirmado' } : p
        )
        deletePresenca(removed.id)
          .then(() => updatePresenca(promoted.id, { posicao: removed.posicao, status: 'confirmado' }))
          .catch(console.error)
        sendPushNotification({
          title: '🎉 Você entrou na lista!',
          body: 'Uma vaga abriu e você foi promovido da fila de espera.',
          userIds: [promoted.usuario_id],
        }).catch(console.error)
        setPresencas(updated)
        return
      }
    }
    setPresencas(updated)
    deletePresenca(removed.id).catch(console.error)
  }

  async function confirmPayment(userId) {
    const p = presencas.find(pr => pr.usuario_id === userId)
    if (!p) return
    setPresencas(ps => ps.map(pr => pr.usuario_id === userId ? { ...pr, status: 'pago' } : pr))
    updatePresenca(p.id, { status: 'pago' }).catch(console.error)
  }

  // ── Presenças: ações do admin ────────────────────────────
  async function validatePayment(presencaId) {
    const p = presencas.find(pr => pr.id === presencaId)
    setPresencas(ps => ps.map(pr => pr.id === presencaId ? { ...pr, status: 'pago' } : pr))
    updatePresenca(presencaId, { status: 'pago' }).catch(console.error)
    if (p) sendPushNotification({
      title: '✅ Pagamento confirmado!',
      body: 'Sua presença na rodada está confirmada.',
      userIds: [p.usuario_id],
    }).catch(console.error)
  }

  async function rejectPayment(presencaId) {
    const p = presencas.find(pr => pr.id === presencaId)
    setPresencas(ps => ps.map(pr => pr.id === presencaId ? { ...pr, status: 'confirmado' } : pr))
    updatePresenca(presencaId, { status: 'confirmado' }).catch(console.error)
    if (p) sendPushNotification({
      title: '❌ Pagamento rejeitado',
      body: 'Seu pagamento foi rejeitado pelo admin. Verifique com o grupo.',
      userIds: [p.usuario_id],
    }).catch(console.error)
  }

  async function removeFromList(presencaId) {
    const removed = presencas.find(p => p.id === presencaId)
    if (!removed) return

    let updated = presencas.filter(p => p.id !== presencaId)
    const fila = updated.filter(p => p.posicao > 20 && p.posicao < 100).sort((a, b) => a.posicao - b.posicao)

    if (fila.length > 0) {
      const promoted = fila[0]
      updated = updated.map(p =>
        p.id === promoted.id ? { ...p, posicao: removed.posicao, status: 'confirmado' } : p
      )
      deletePresenca(presencaId)
        .then(() => updatePresenca(promoted.id, { posicao: removed.posicao, status: 'confirmado' }))
        .catch(console.error)
      sendPushNotification({
        title: '🎉 Você entrou na lista!',
        body: 'Uma vaga abriu e você foi promovido da fila de espera.',
        userIds: [promoted.usuario_id],
      }).catch(console.error)
    } else {
      deletePresenca(presencaId).catch(console.error)
    }
    setPresencas(updated)
  }

  async function promotePlayerFromQueue(presencaId) {
    const promoted = presencas.find(p => p.id === presencaId)
    if (!promoted || promoted.posicao <= 20) return

    const lista = presencas.filter(p => p.posicao <= 20)
    if (lista.length >= 20) return

    const takenPos = new Set(lista.map(p => p.posicao))
    let freePos = null
    for (let i = 1; i <= 20; i++) {
      if (!takenPos.has(i)) { freePos = i; break }
    }
    if (freePos === null) return

    setPresencas(ps => ps.map(p => p.id === presencaId ? { ...p, posicao: freePos, status: 'confirmado' } : p))
    updatePresenca(presencaId, { posicao: freePos, status: 'confirmado' }).catch(console.error)
    sendPushNotification({
      title: '🎉 Você entrou na lista!',
      body: 'O admin promoveu você da fila de espera.',
      userIds: [promoted.usuario_id].filter(Boolean),
    }).catch(console.error)
  }

  // ── Sorteio ──────────────────────────────────────────────
  async function performDraw() {
    if (!rodada) return
    const lista = presencas.filter(p => p.posicao <= 20).sort((a, b) => a.posicao - b.posicao)
    const players = lista.map(p => p.profiles)
    const drawn = drawTeams(players)

    setTeams(drawn)
    setMatchHistory([])
    setStatus('sorteada')

    try {
      const saved = await saveDrawToDb(rodada.id, drawn)
      setTeams(saved)
      sendPushNotification({ title: '🎲 Times sorteados!', body: 'Os times foram sorteados. Veja sua equipe!' }).catch(() => {})
    } catch (err) {
      console.error('Erro ao salvar sorteio:', err)
    }
  }

  // ── Resultado de partida ─────────────────────────────────
  async function addMatchResult(result) {
    setMatchHistory(h => [...h, result])
    if (!rodada || !teams) return
    savePartida(rodada.id, teams, result).catch(console.error)
  }

  return (
    <RodadaContext.Provider value={{
      rodada, presencas, teams, matchHistory, loading,
      setTeams, setMatchHistory,
      setStatus, closeList, clearPresencas, createNovaRodada,
      joinList, leaveList, addGuest, confirmPayment,
      validatePayment, rejectPayment, removeFromList, promotePlayerFromQueue,
      performDraw, addMatchResult,
      votacaoRodadaAberta,
      refresh,
    }}>
      {children}
    </RodadaContext.Provider>
  )
}

export function useRodada() {
  return useContext(RodadaContext)
}
