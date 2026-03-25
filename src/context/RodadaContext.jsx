import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  fetchLatestRodada, createRodada,
  fetchPresencas, insertPresenca, deletePresenca, updatePresenca,
  updateRodadaStatus, finalizeRodada,
  saveDrawToDb, fetchTeams,
  savePartida, fetchMatchHistory,
  sendPushNotification,
} from '@/lib/api'
import { drawTeams } from '@/lib/teamDraw'

const RodadaContext = createContext(null)

export function RodadaProvider({ children }) {
  const [rodada, setRodada]             = useState(null)
  const [presencas, setPresencas]       = useState([])
  const [teams, setTeams]               = useState(null)
  const [matchHistory, setMatchHistory] = useState([])
  const [loading, setLoading]           = useState(true)

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

  // ── Status da rodada ─────────────────────────────────────
  async function setStatus(status) {
    if (!rodada) return
    setRodada(r => ({ ...r, status })) // optimistic
    try {
      if (status === 'encerrada') {
        await finalizeRodada(rodada.id, matchHistory, presencas)
      } else {
        await updateRodadaStatus(rodada.id, status)
      }
      if (status === 'aberta') {
        sendPushNotification({ title: '⚽ Lista aberta!', body: 'A lista da rodada está aberta. Confirme sua presença!' }).catch(() => {})
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
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
    const lista = presencas.filter(p => p.posicao <= 20)
    const fila  = presencas.filter(p => p.posicao > 20)
    const isQueue = lista.length >= 20
    const posicao = isQueue ? fila.length + 21 : lista.length + 1
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

  async function leaveList(userId) {
    const removed = presencas.find(p => p.usuario_id === userId)
    if (!removed) return

    // Optimistic
    let updated = presencas.filter(p => p.usuario_id !== userId)
    if (removed.posicao <= 20) {
      const filaOrdenada = updated.filter(p => p.posicao > 20).sort((a, b) => a.posicao - b.posicao)
      if (filaOrdenada.length > 0) {
        const promoted = filaOrdenada[0]
        updated = updated.map(p =>
          p.id === promoted.id ? { ...p, posicao: removed.posicao, status: 'confirmado' } : p
        )
        deletePresenca(removed.id).catch(console.error)
        updatePresenca(promoted.id, { posicao: removed.posicao, status: 'confirmado' }).catch(console.error)
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
    setPresencas(ps => ps.map(p => p.id === presencaId ? { ...p, status: 'pago' } : p))
    updatePresenca(presencaId, { status: 'pago' }).catch(console.error)
  }

  async function rejectPayment(presencaId) {
    setPresencas(ps => ps.map(p => p.id === presencaId ? { ...p, status: 'confirmado' } : p))
    updatePresenca(presencaId, { status: 'confirmado' }).catch(console.error)
  }

  async function removeFromList(presencaId) {
    const removed = presencas.find(p => p.id === presencaId)
    if (!removed) return

    let updated = presencas.filter(p => p.id !== presencaId)
    const fila = updated.filter(p => p.posicao > 20).sort((a, b) => a.posicao - b.posicao)

    deletePresenca(presencaId).catch(console.error)

    if (fila.length > 0) {
      const promoted = fila[0]
      updated = updated.map(p =>
        p.id === promoted.id ? { ...p, posicao: removed.posicao, status: 'confirmado' } : p
      )
      updatePresenca(promoted.id, { posicao: removed.posicao, status: 'confirmado' }).catch(console.error)
    }
    setPresencas(updated)
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
      setStatus, createNovaRodada,
      joinList, leaveList, confirmPayment,
      validatePayment, rejectPayment, removeFromList,
      performDraw, addMatchResult,
      refresh,
    }}>
      {children}
    </RodadaContext.Provider>
  )
}

export function useRodada() {
  return useContext(RodadaContext)
}
