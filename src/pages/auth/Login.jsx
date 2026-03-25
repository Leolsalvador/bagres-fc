import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signIn, signUp, signInWithGoogle, user, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (authLoading) return
    if (!user) return
    if (profile?.status === 'aprovado') navigate('/home', { replace: true })
    else if (profile?.status === 'pendente') navigate('/aguardando', { replace: true })
  }, [user, profile, authLoading, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isRegistering) {
      const { error } = await signUp(email, password, nome)
      if (error) setError(error.message)
      else navigate('/aguardando')
    } else {
      const { error } = await signIn(email, password)
      if (error) setError('Email ou senha inválidos')
      else navigate('/home')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
          <span className="text-4xl">⚽</span>
        </div>
        <h1 className="text-4xl font-black text-text-main tracking-widest uppercase">Bagres FC</h1>
        <p className="text-text-muted text-sm mt-1">Gestão de peladas</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-card rounded-2xl p-6 space-y-4 shadow-xl">
        <h2 className="text-text-main font-bold text-xl text-center">
          {isRegistering ? 'Criar conta' : 'Entrar'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          {isRegistering && (
            <input
              type="text"
              placeholder="Seu nome completo"
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
              className="w-full bg-input text-text-main placeholder-text-muted rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary text-base"
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full bg-input text-text-main placeholder-text-muted rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary text-base"
          />

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
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
            {loading ? 'Carregando...' : isRegistering ? 'Criar conta' : 'Entrar'}
          </button>
        </form>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-text-muted text-xs">ou</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button
          onClick={signInWithGoogle}
          className="w-full bg-white text-gray-900 font-semibold py-3 rounded-xl flex items-center justify-center gap-3 active:scale-95 transition-transform text-base"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Entrar com Google
        </button>

        <p className="text-center text-text-muted text-sm">
          {isRegistering ? 'Já tem conta? ' : 'Não tem conta? '}
          <button
            onClick={() => { setIsRegistering(v => !v); setError('') }}
            className="text-primary font-semibold"
          >
            {isRegistering ? 'Entrar' : 'Criar conta'}
          </button>
        </p>
      </div>
    </div>
  )
}
