import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Star, Target, Handshake, Shirt, Pencil, Check, X, Camera, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { updateProfile, uploadAvatar } from '@/lib/api'

export default function Perfil() {
  const { profile, refreshProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const isAdmin = profile?.papel === 'admin'

  const [editing, setEditing]     = useState(false)
  const [nome, setNome]           = useState('')
  const [saving, setSaving]       = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState('')
  const fileRef = useRef(null)

  const POSICOES = ['ATA', 'MEI', 'ZAG', 'GOL', 'CORINGA']
  const POSICAO_LABEL = { ATA: 'Atacante', MEI: 'Meia', ZAG: 'Zagueiro', GOL: 'Goleiro', CORINGA: 'Coringa' }
  const POSICAO_COLOR = { ATA: 'bg-red-500/20 text-red-400', MEI: 'bg-blue-500/20 text-blue-400', ZAG: 'bg-yellow-500/20 text-yellow-400', GOL: 'bg-purple-500/20 text-purple-400', CORINGA: 'bg-primary/20 text-primary' }

  async function savePosicao(pos) {
    try {
      await updateProfile(profile.id, { posicao_campo: pos })
      await refreshProfile()
    } catch {
      setError('Erro ao salvar posição.')
    }
  }

  const stats = [
    { label: 'Gols',    value: profile?.gols ?? 0,                                icon: Target    },
    { label: 'Assist.', value: profile?.assistencias ?? 0,                         icon: Handshake },
    { label: 'Jogos',   value: profile?.jogos ?? 0,                                icon: Shirt     },
    { label: 'Rating',  value: profile?.rating ? profile.rating.toFixed(1) : '—', icon: Star      },
  ]

  function startEdit() {
    setNome(profile?.nome ?? '')
    setError('')
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setError('')
  }

  async function saveNome() {
    if (!nome.trim()) return
    setSaving(true)
    setError('')
    try {
      await updateProfile(profile.id, { nome: nome.trim() })
      await refreshProfile()
      setEditing(false)
    } catch {
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Imagem muito grande. Máximo 5 MB.')
      return
    }
    setUploading(true)
    setError('')
    try {
      const url = await uploadAvatar(profile.id, file)
      await updateProfile(profile.id, { foto_url: url })
      await refreshProfile()
    } catch (err) {
      console.error('uploadAvatar error:', err)
      setError(err?.message ?? 'Erro ao enviar foto. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-full bg-background">
      <div className="px-4 pt-10 pb-4">
        <h1 className="text-2xl font-black text-text-main uppercase tracking-widest">Perfil</h1>
      </div>

      {/* Avatar + nome */}
      <div className="flex flex-col items-center py-6 px-4">
        {/* Avatar com botão de troca */}
        <div className="relative mb-3">
          <div className="w-24 h-24 rounded-full bg-card flex items-center justify-center overflow-hidden ring-2 ring-primary">
            {uploading ? (
              <span className="text-text-muted text-xs">...</span>
            ) : profile?.foto_url ? (
              <img src={profile.foto_url} alt={profile.nome} className="w-full h-full object-contain" />
            ) : (
              <span className="text-5xl">👤</span>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform"
          >
            <Camera size={14} className="text-black" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        {/* Nome editável */}
        {editing ? (
          <div className="flex items-center gap-2 mt-1">
            <input
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="bg-card text-text-main rounded-xl px-3 py-1.5 text-base font-bold outline-none focus:ring-2 focus:ring-primary text-center"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && saveNome()}
            />
            <button onClick={saveNome} disabled={saving} className="text-primary active:scale-90">
              <Check size={20} />
            </button>
            <button onClick={cancelEdit} className="text-text-muted active:scale-90">
              <X size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-1">
            <p className="text-text-main font-bold text-xl">{profile?.nome ?? '—'}</p>
            <button onClick={startEdit} className="text-text-muted active:scale-90">
              <Pencil size={15} />
            </button>
          </div>
        )}

        <span className={`mt-1 text-xs font-semibold px-3 py-0.5 rounded-full ${
          profile?.papel === 'admin' ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary'
        }`}>
          {profile?.papel === 'admin' ? 'Administrador' : 'Jogador'}
        </span>

        {error && (
          <p className="text-danger text-xs mt-2 text-center">{error}</p>
        )}
      </div>

      {/* Posição */}
      <div className="mx-4 mb-6">
        <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-3">Minha posição</p>
        <div className="flex gap-2 flex-wrap">
          {POSICOES.map(pos => (
            <button
              key={pos}
              onClick={() => savePosicao(pos)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                profile?.posicao_campo === pos
                  ? POSICAO_COLOR[pos]
                  : 'bg-card text-text-muted'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
        {profile?.posicao_campo && (
          <p className="text-text-muted text-xs mt-2">{POSICAO_LABEL[profile.posicao_campo]}</p>
        )}
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

      {/* Painel Admin */}
      {isAdmin && (
        <div className="mx-4 mb-3">
          <button
            onClick={() => navigate('/admin/usuarios')}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-secondary/30 text-secondary text-sm font-semibold active:scale-95 transition-transform"
          >
            <ShieldCheck size={16} />
            Painel Admin
          </button>
        </div>
      )}

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
