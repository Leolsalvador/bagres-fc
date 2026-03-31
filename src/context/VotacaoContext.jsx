import { createContext, useContext, useState, useEffect } from 'react'
import { fetchLatestCiclo, createCiclo, clearMyVotos, sendPushNotification } from '@/lib/api'

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

  async function votarComoAdmin(adminId) {
    try {
      if (ciclo?.id && adminId) await clearMyVotos(ciclo.id, adminId)
    } catch (err) {
      console.error('Erro ao limpar votos do admin:', err)
    }
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
