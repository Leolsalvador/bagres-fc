import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { calcularClassificacao } from '@/lib/roundRobin'
import { USE_MOCK, mockCampeonato, mockCampeonatoTimes, mockCampeonatoPartidas, mockCampeonatoEventos, mockCampeonatoJogadores } from '@/lib/mockData'

const CampeonatoContext = createContext(null)

export function CampeonatoProvider({ children }) {
  const [campeonato, setCampeonato] = useState(null)
  const [times, setTimes] = useState([])
  const [partidas, setPartidas] = useState([])
  const [eventos, setEventos] = useState([])
  const [jogadores, setJogadores] = useState([]) // profiles de todos os jogadores do campeonato
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    if (USE_MOCK) {
      setCampeonato(mockCampeonato)
      setTimes(mockCampeonatoTimes)
      setPartidas(mockCampeonatoPartidas)
      setEventos(mockCampeonatoEventos)
      setJogadores(mockCampeonatoJogadores)
      setLoading(false)
      return
    }
    try {
      const { data: camp } = await supabase
        .from('campeonatos')
        .select('*')
        .eq('visivel', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!camp) {
        setCampeonato(null)
        setTimes([])
        setPartidas([])
        setEventos([])
        setJogadores([])
        setLoading(false)
        return
      }

      setCampeonato(camp)

      const [{ data: timesData }, { data: partidasData }, { data: eventosData }] = await Promise.all([
        supabase
          .from('campeonato_times')
          .select('*, campeonato_time_jogadores(jogador_id, profiles(id, nome, foto_url))')
          .eq('campeonato_id', camp.id)
          .order('grupo'),
        supabase
          .from('campeonato_partidas')
          .select('*, time_casa:campeonato_times!time_casa_id(id, nome, cor, cor_secundaria), time_visitante:campeonato_times!time_visitante_id(id, nome, cor, cor_secundaria), mvp:profiles!mvp_id(id, nome, foto_url)')
          .eq('campeonato_id', camp.id)
          .order('ordem'),
        supabase
          .from('campeonato_eventos')
          .select('*, profiles(id, nome, foto_url), campeonato_times(id, nome, cor, cor_secundaria)')
          .eq('campeonato_id', camp.id)
          .order('created_at'),
      ])

      const timesArr = timesData ?? []
      setTimes(timesArr)
      setPartidas(partidasData ?? [])
      setEventos(eventosData ?? [])

      // Extrai todos os perfis únicos dos times
      const profiles = []
      const seen = new Set()
      timesArr.forEach(t => {
        t.campeonato_time_jogadores?.forEach(tj => {
          if (tj.profiles && !seen.has(tj.profiles.id)) {
            seen.add(tj.profiles.id)
            profiles.push({ ...tj.profiles, time_id: t.id })
          }
        })
      })
      setJogadores(profiles)
    } catch (err) {
      console.error('Erro ao carregar campeonato:', err)
    }
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  // Realtime: atualiza quando partidas ou campeonato mudam
  useEffect(() => {
    if (!campeonato?.id) return

    const channel = supabase
      .channel(`campeonato-${campeonato.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campeonatos', filter: `id=eq.${campeonato.id}` }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campeonato_partidas', filter: `campeonato_id=eq.${campeonato.id}` }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campeonato_eventos', filter: `campeonato_id=eq.${campeonato.id}` }, () => refresh())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [campeonato?.id, refresh])

  // Classificação calculada por grupo
  const timesGrupoA = times.filter(t => t.grupo === 'A')
  const timesGrupoB = times.filter(t => t.grupo === 'B')
  const classificacaoA = calcularClassificacao(timesGrupoA, partidas)
  const classificacaoB = calcularClassificacao(timesGrupoB, partidas)

  // Artilheiro e garçom
  const estatisticas = calcularEstatisticas(eventos, jogadores)

  function updatePartidaLocal(id, updates) {
    setPartidas(ps => ps.map(p => p.id === id ? { ...p, ...updates } : p))
  }

  return (
    <CampeonatoContext.Provider value={{
      campeonato, times, partidas, eventos, jogadores,
      classificacaoA, classificacaoB, estatisticas,
      loading, refresh, updatePartidaLocal,
    }}>
      {children}
    </CampeonatoContext.Provider>
  )
}

function calcularEstatisticas(eventos, jogadores) {
  const gols = {}
  const assists = {}

  eventos.forEach(e => {
    const id = e.jogador_id
    if (e.tipo === 'gol') gols[id] = (gols[id] ?? 0) + 1
    if (e.tipo === 'assistencia') assists[id] = (assists[id] ?? 0) + 1
  })

  const artilheiro = Object.entries(gols)
    .sort((a, b) => b[1] - a[1])
    .map(([id, total]) => ({ profile: jogadores.find(j => j.id === id), total }))
    .filter(x => x.profile)

  const garcom = Object.entries(assists)
    .sort((a, b) => b[1] - a[1])
    .map(([id, total]) => ({ profile: jogadores.find(j => j.id === id), total }))
    .filter(x => x.profile)

  return { artilheiro, garcom }
}

export function useCampeonato() {
  return useContext(CampeonatoContext)
}
