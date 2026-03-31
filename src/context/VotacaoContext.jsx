import { createContext, useContext, useState, useEffect } from 'react'
import { fetchLatestCiclo, createCiclo, clearAllVotosAndRatings, sendPushNotification } from '@/lib/api'
import { supabase } from '@/lib/supabase'

const VotacaoContext = createContext(null)

export function VotacaoProvider({ children }) {
  const [ciclo, setCiclo]               = useState(null)
  const [votacaoAberta, setVotacaoAbertaState] = useState(false)

  useEffect(() => {
    fetchLatestCiclo()
      .then(c => {
        setCiclo(c)
        setVotacaoAbertaState(c?.aberta ?? false)
      })
      .catch(console.error)

    // Liga a antena para qualquer celular perceber que o admin abriu novo ciclo
    const channel = supabase
      .channel('ciclos-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ciclos_votacao' }, (payload) => {
        setCiclo(payload.new)
        setVotacaoAbertaState(payload.new.aberta)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ciclos_votacao' }, (payload) => {
        setCiclo(payload.new)
        setVotacaoAbertaState(payload.new.aberta)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function reabrirVotacao() {
    try {
      const novo = await createCiclo()
      setCiclo(novo)
      setVotacaoAbertaState(true)
      sendPushNotification({ title: '⭐ Votação aberta!', body: 'Avalie seus colegas de pelada!' }).catch(() => {})
    } catch (err) {
      console.error('Erro ao reabrir votação:', err)
    }
  }

  async function votarComoAdmin() {
    // Limpa todos os votos e zera ratings via RPC (security definer — bypassa RLS)
    await clearAllVotosAndRatings()
    // Avisa o Home (e outras telas) para recarregar os ratings zerados
    supabase.channel('home-profiles').send({
      type: 'broadcast',
      event: 'ratings-reset',
    }).catch(() => {})
    const novo = await createCiclo(true) // apenas_admins = true
    setCiclo(novo)
    setVotacaoAbertaState(true)
  }

  return (
    <VotacaoContext.Provider value={{ ciclo, votacaoAberta, reabrirVotacao, votarComoAdmin }}>
      {children}
    </VotacaoContext.Provider>
  )
}

export function useVotacao() {
  return useContext(VotacaoContext)
}
