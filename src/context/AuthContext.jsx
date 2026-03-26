import { createContext, useEffect, useState } from 'react'
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

    // Perfil não existe — primeiro login via Google OAuth
    // Cria como pendente para o admin aprovar
    const { data: { user: u } } = await supabase.auth.getUser()
    const nome = u?.user_metadata?.full_name || u?.user_metadata?.name || u?.email || 'Novo Jogador'
    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({ id: userId, nome, email: u?.email, status: 'pendente', papel: 'usuario' })
      .select()
      .maybeSingle()
    setProfile(newProfile)
    return newProfile
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

  async function refreshProfile() {
    if (user) await fetchProfile(user.id)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signInWithGoogle, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}
