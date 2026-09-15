import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Eye, EyeOff } from 'lucide-react'

export default function ResetPassword() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => navigate('/home', { replace: true }), 2000)
    return () => clearTimeout(t)
  }, [done, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('A senha precisa ter pelo menos 6 caracteres'); return }
    if (password !== confirm) { setError('As senhas não coincidem'); return }

    setLoading(true)
    const { error } = await updatePassword(password)
    if (error) setError('Não deu pra trocar a senha. O link pode ter expirado — peça um novo em "Esqueceu a senha?".')
    else setDone(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="mb-10 text-center">
        <img src="/logo.png" alt="Bagres FC" className="w-36 h-36 rounded-full mx-auto mb-4 object-cover shadow-lg shadow-black/40" />
        <p className="text-text-muted text-sm mt-1">Gestão de peladas</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-card rounded-2xl p-6 space-y-4 shadow-xl">
        <h2 className="text-text-main font-bold text-xl text-center">Criar nova senha</h2>

        {done ? (
          <p className="text-primary text-sm text-center">Senha atualizada! Redirecionando...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Nova senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-input text-text-main placeholder-text-muted rounded-xl px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-primary text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirme a nova senha"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              minLength={6}
              className="w-full bg-input text-text-main placeholder-text-muted rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary text-base"
            />

            {error && (
              <p className="text-danger text-sm text-center bg-danger/10 py-2 px-3 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-black font-bold py-3 rounded-xl disabled:opacity-50 active:scale-95 transition-transform text-base mt-1"
            >
              {loading ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
