import { LogOut, Star, Target, Handshake, Shirt } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function Perfil() {
  const { profile, signOut } = useAuth()

  const stats = [
    { label: 'Gols', value: profile?.gols ?? 0, icon: Target },
    { label: 'Assist.', value: profile?.assistencias ?? 0, icon: Handshake },
    { label: 'Jogos', value: profile?.jogos ?? 0, icon: Shirt },
    { label: 'Rating', value: profile?.rating ? profile.rating.toFixed(1) : '—', icon: Star },
  ]

  return (
    <div className="min-h-full bg-background">
      <div className="px-4 pt-10 pb-4">
        <h1 className="text-2xl font-black text-text-main uppercase tracking-widest">Perfil</h1>
      </div>

      {/* Avatar + nome */}
      <div className="flex flex-col items-center py-6 px-4">
        <div className="w-24 h-24 rounded-full bg-card flex items-center justify-center overflow-hidden mb-3 ring-2 ring-primary">
          {profile?.foto_url
            ? <img src={profile.foto_url} alt={profile.nome} className="w-full h-full object-cover" />
            : <span className="text-5xl">👤</span>}
        </div>
        <p className="text-text-main font-bold text-xl">{profile?.nome ?? '—'}</p>
        <span className={`mt-1 text-xs font-semibold px-3 py-0.5 rounded-full ${
          profile?.papel === 'admin' ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary'
        }`}>
          {profile?.papel === 'admin' ? 'Administrador' : 'Jogador'}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mx-4 mb-6">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-card rounded-2xl p-3 flex flex-col items-center gap-1">
            <Icon size={18} className="text-primary" />
            <p className="text-text-main font-black text-lg">{value}</p>
            <p className="text-text-muted text-xs">{label}</p>
          </div>
        ))}
      </div>

      {/* Editar perfil — placeholder */}
      <div className="mx-4 mb-4 bg-card rounded-2xl p-4">
        <p className="text-text-muted text-sm text-center">
          Edição de perfil disponível em breve.
        </p>
      </div>

      {/* Sair */}
      <div className="mx-4">
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-danger/30 text-danger text-sm font-semibold active:scale-95 transition-transform"
        >
          <LogOut size={16} />
          Sair da conta
        </button>
      </div>
    </div>
  )
}
