import { Clock, LogOut } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function PendingApproval() {
  const { signOut, profile, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) navigate('/login', { replace: true })
  }, [user, navigate])

  useEffect(() => {
    if (profile?.status === 'aprovado') navigate('/home', { replace: true })
  }, [profile, navigate])

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

      <button
        onClick={signOut}
        className="mt-10 flex items-center gap-2 text-text-muted text-sm active:scale-95 transition-transform"
      >
        <LogOut size={16} />
        Sair da conta
      </button>
    </div>
  )
}
