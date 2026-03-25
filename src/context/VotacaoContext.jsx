import { createContext, useContext, useState, useEffect } from 'react'
import { fetchLatestCiclo, createCiclo, updateCiclo, sendPushNotification } from '@/lib/api'

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

  async function setVotacaoAberta(open) {
    setVotacaoAbertaState(open) // optimistic
    try {
      if (!ciclo) {
        if (open) {
          const novo = await createCiclo()
          setCiclo(novo)
          sendPushNotification({ title: '⭐ Votação aberta!', body: 'Avalie seus colegas de pelada!' }).catch(() => {})
        }
      } else {
        await updateCiclo(ciclo.id, open)
        setCiclo(c => ({ ...c, aberta: open }))
        if (open) sendPushNotification({ title: '⭐ Votação aberta!', body: 'Avalie seus colegas de pelada!' }).catch(() => {})
      }
    } catch (err) {
      setVotacaoAbertaState(!open) // reverte
      console.error('Erro ao alterar votação:', err)
    }
  }

  return (
    <VotacaoContext.Provider value={{ ciclo, votacaoAberta, setVotacaoAberta }}>
      {children}
    </VotacaoContext.Provider>
  )
}

export function useVotacao() {
  return useContext(VotacaoContext)
}
