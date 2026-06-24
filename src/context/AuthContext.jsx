import { createContext, useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { USE_MOCK, mockCurrentUser } from '@/lib/mockData'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (data) {
      setProfile(data)
      return data
    }

    // Primeiro login via Google OAuth — só cria perfil se não existir
    // Usa upsert com ignoreDuplicates para evitar sobrescrever perfil existente bloqueado por RLS
    const { data: { user: u } } = await supabase.auth.getUser()
    const nome = u?.user_metadata?.full_name || u?.user_metadata?.name || u?.email || 'Novo Jogador'
    const { data: newProfile } = await supabase
      .from('profiles')
      .upsert(
        { id: userId, nome, email: u?.email, status: 'pendente', papel: 'usuario' },
        { onConflict: 'id', ignoreDuplicates: true }
      )
      .select()
      .maybeSingle()

    if (newProfile) {
      setProfile(newProfile)
      return newProfile
    }

    // Perfil já existe mas RLS bloqueia leitura (usuário pendente sem policy correta)
    // Retorna perfil mínimo para o app não ficar preso
    const fallback = { id: userId, status: 'pendente', papel: 'usuario', nome }
    setProfile(fallback)
    return fallback
  }

  useEffect(() => {
    if (USE_MOCK) {
      setUser({ id: mockCurrentUser.id })
      setProfile(mockCurrentUser)
      setLoading(false)
      return
    }

    let realtimeChannel = null

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false))
        subscribeToProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        setLoading(true)
        fetchProfile(session.user.id).finally(() => setLoading(false))
        subscribeToProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
        realtimeChannel?.unsubscribe()
      }
    })

    function subscribeToProfile(userId) {
      realtimeChannel?.unsubscribe()
      realtimeChannel = supabase
        .channel('profile-status')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        }, (payload) => {
          setProfile(payload.new)
        })
        .subscribe()
    }

    return () => {
      subscription.unsubscribe()
      realtimeChannel?.unsubscribe()
    }
  }, [])

  async function signIn(email, password) {
    return supabase.auth.signInWithPassword({ email, password })
  }

  async function signInWithGoogle() {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/login` },
    })
  }

  async function signUp(email, password, nome) {
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: nome } },
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id)
  }, [user])

  const isAdmin        = profile?.papel === 'admin'
  const isTelespectador = profile?.papel === 'telespectador'
  const isJogador      = profile?.papel === 'usuario'

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signInWithGoogle, signUp, signOut, refreshProfile, isAdmin, isTelespectador, isJogador }}>
      {children}
    </AuthContext.Provider>
  )
}
