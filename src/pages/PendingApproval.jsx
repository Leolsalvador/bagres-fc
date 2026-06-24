import { Clock, LogOut, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export default function PendingApproval() {
  const { signOut, profile, user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(false)
  const [dbStatus, setDbStatus] = useState(null)

  useEffect(() => {
    if (!user) navigate('/login', { replace: true })
  }, [user, navigate])

  useEffect(() => {
    if (profile?.status === 'aprovado') navigate('/home', { replace: true })
  }, [profile, navigate])

  // Polling a cada 5s
  useEffect(() => {
    const uid = user?.id
    if (!uid) return
    const interval = setInterval(() => checkAndRedirect(uid), 5000)
    return () => clearInterval(interval)
  }, [user?.id]) // eslint-disable-line

  async function checkAndRedirect(uid) {
    const { data } = await supabase.from('profiles').select('status').eq('id', uid).single()
    setDbStatus(data?.status ?? 'erro ao buscar')
    if (data?.status === 'aprovado') {
      await refreshProfile()
      navigate('/home', { replace: true })
    }
  }

  async function handleCheckManual() {
    setChecking(true)
    await checkAndRedirect(user?.id)
    setChecking(false)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-6">
        <Clock size={44} className="text-secondary" />
      </div>

      <h1 className="text-2xl font-black text-text-main uppercase tracking-wide mb-3">
        Aguardando aprovação
      </h1>

      <p className="text-text-muted text-base max-w-xs leading-relaxed">
        Olá{profile?.nome ? `, ${profile.nome.split(' ')[0]}` : ''}! Seu cadastro foi recebido.
        Um administrador vai liberar seu acesso em breve.
      </p>

      <div className="mt-4 bg-secondary/10 border border-secondary/20 rounded-xl px-4 py-3 max-w-xs">
        <p className="text-secondary text-sm font-medium">
          Você será redirecionado automaticamente quando aprovado.
        </p>
      </div>

      {dbStatus && (
        <p className="mt-3 text-xs text-text-muted">Status no banco: <span className="font-bold text-text-main">{dbStatus}</span></p>
      )}

      <button
        onClick={handleCheckManual}
        disabled={checking}
        className="mt-6 flex items-center gap-2 text-primary text-sm font-semibold active:scale-95 transition-transform disabled:opacity-50"
      >
        <RefreshCw size={15} className={checking ? 'animate-spin' : ''} />
        {checking ? 'Verificando...' : 'Verificar aprovação'}
      </button>

      <button
        onClick={signOut}
        className="mt-6 flex items-center gap-2 text-text-muted text-sm active:scale-95 transition-transform"
      >
        <LogOut size={16} />
        Sair da conta
      </button>
    </div>
  )
}
