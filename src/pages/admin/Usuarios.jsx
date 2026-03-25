import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ShieldCheck, User, Trash2, Check, X, Plus, Crown, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { key: 'pendentes', label: 'Pendentes' },
  { key: 'membros',   label: 'Membros'   },
  { key: 'rejeitados',label: 'Rejeitados'},
]

export default function Usuarios() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('pendentes')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('created_at')
    setProfiles(data ?? [])
    setLoading(false)
  }

  async function approve(id) {
    await supabase.from('profiles').update({ status: 'aprovado' }).eq('id', id)
    setProfiles(p => p.map(u => u.id === id ? { ...u, status: 'aprovado' } : u))
  }

  async function reject(id) {
    await supabase.from('profiles').update({ status: 'rejeitado' }).eq('id', id)
    setProfiles(p => p.map(u => u.id === id ? { ...u, status: 'rejeitado' } : u))
  }

  async function toggleAdmin(id, papel) {
    const novo = papel === 'admin' ? 'usuario' : 'admin'
    await supabase.from('profiles').update({ papel: novo }).eq('id', id)
    setProfiles(p => p.map(u => u.id === id ? { ...u, papel: novo } : u))
  }

  async function deleteUser(id) {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return
    await supabase.from('profiles').delete().eq('id', id)
    setProfiles(p => p.filter(u => u.id !== id))
  }

  async function createUser({ nome, email, password, papel }) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return alert('Erro: ' + error.message)
    if (data.user) {
      await supabase.from('profiles')
        .update({ nome, papel, status: 'aprovado', email })
        .eq('id', data.user.id)
      await fetchAll()
    }
    setShowModal(false)
  }

  const pendentes  = profiles.filter(p => p.status === 'pendente')
  const membros    = profiles.filter(p => p.status === 'aprovado')
  const rejeitados = profiles.filter(p => p.status === 'rejeitado')

  const listMap = { pendentes, membros, rejeitados }
  const current = listMap[tab] ?? []

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="px-4 pt-10 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-text-main uppercase tracking-widest">Usuários</h1>
          <p className="text-text-muted text-sm mt-0.5">Administração de contas</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="w-10 h-10 bg-primary rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-lg shadow-primary/30"
        >
          <Plus size={20} className="text-black" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mx-4 mb-4 bg-card rounded-xl p-1">
        {TABS.map(t => {
          const count = listMap[t.key]?.length ?? 0
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex-1 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1',
                tab === t.key ? 'bg-primary text-black' : 'text-text-muted'
              )}
            >
              {t.label}
              {count > 0 && (
                <span className={cn(
                  'text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center',
                  tab === t.key ? 'bg-black/20 text-black' : 'bg-border text-text-muted'
                )}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* List */}
      <div className="px-4 space-y-3 pb-6">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && current.length === 0 && (
          <div className="flex flex-col items-center py-16 text-text-muted">
            <User size={36} className="mb-3 opacity-40" />
            <p className="text-sm">Nenhum usuário aqui.</p>
          </div>
        )}

        {!loading && current.map(u => (
          <UserCard
            key={u.id}
            user={u}
            tab={tab}
            onApprove={() => approve(u.id)}
            onReject={() => reject(u.id)}
            onToggleAdmin={() => toggleAdmin(u.id, u.papel)}
            onDelete={() => deleteUser(u.id)}
          />
        ))}
      </div>

      {showModal && (
        <CreateUserModal
          onClose={() => setShowModal(false)}
          onCreate={createUser}
        />
      )}
    </div>
  )
}

function UserCard({ user, tab, onApprove, onReject, onToggleAdmin, onDelete }) {
  return (
    <div className="bg-card rounded-2xl p-4">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full bg-elevated flex items-center justify-center overflow-hidden shrink-0">
          {user.foto_url
            ? <img src={user.foto_url} alt={user.nome} className="w-full h-full object-contain" />
            : <User size={20} className="text-text-muted" />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-text-main font-semibold text-sm truncate">{user.nome}</p>
            {user.papel === 'admin' && (
              <Crown size={12} className="text-secondary shrink-0" />
            )}
          </div>
          <p className="text-text-muted text-xs truncate">{user.email ?? '—'}</p>
        </div>

        {/* Status badge */}
        <StatusBadge status={user.status} />
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        {tab === 'pendentes' && (
          <>
            <ActionBtn onClick={onApprove} color="green" icon={<Check size={14} />} label="Aprovar" />
            <ActionBtn onClick={onReject}  color="red"   icon={<X size={14} />}     label="Rejeitar" />
          </>
        )}

        {tab === 'membros' && (
          <>
            <ActionBtn
              onClick={onToggleAdmin}
              color="yellow"
              icon={<Crown size={14} />}
              label={user.papel === 'admin' ? 'Remover admin' : 'Tornar admin'}
            />
            <ActionBtn onClick={onDelete} color="red" icon={<Trash2 size={14} />} label="Excluir" />
          </>
        )}

        {tab === 'rejeitados' && (
          <>
            <ActionBtn onClick={onApprove} color="green" icon={<Check size={14} />} label="Aprovar" />
            <ActionBtn onClick={onDelete}  color="red"   icon={<Trash2 size={14} />} label="Excluir" />
          </>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    aprovado:  'bg-primary/15 text-primary',
    pendente:  'bg-secondary/15 text-secondary',
    rejeitado: 'bg-danger/15 text-danger',
  }
  const label = { aprovado: 'Aprovado', pendente: 'Pendente', rejeitado: 'Rejeitado' }
  return (
    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0', map[status])}>
      {label[status]}
    </span>
  )
}

function ActionBtn({ onClick, color, icon, label }) {
  const colors = {
    green:  'bg-primary/10  text-primary  active:bg-primary/20',
    red:    'bg-danger/10   text-danger   active:bg-danger/20',
    yellow: 'bg-secondary/10 text-secondary active:bg-secondary/20',
  }
  return (
    <button
      onClick={onClick}
      className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-1 justify-center active:scale-95 transition-transform', colors[color])}
    >
      {icon}{label}
    </button>
  )
}

function CreateUserModal({ onClose, onCreate }) {
  const [nome, setNome]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [papel, setPapel]       = useState('usuario')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    await onCreate({ nome, email, password, papel })
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card rounded-t-3xl p-6 space-y-4">
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-2" />
        <h2 className="text-text-main font-bold text-lg">Novo usuário</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text" placeholder="Nome completo" value={nome}
            onChange={e => setNome(e.target.value)} required
            className="w-full bg-input text-text-main placeholder-text-muted rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary text-base"
          />
          <input
            type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} required
            className="w-full bg-input text-text-main placeholder-text-muted rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary text-base"
          />
          <input
            type="password" placeholder="Senha provisória" value={password}
            onChange={e => setPassword(e.target.value)} required minLength={6}
            className="w-full bg-input text-text-main placeholder-text-muted rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary text-base"
          />

          {/* Role selector */}
          <div className="relative">
            <select
              value={papel} onChange={e => setPapel(e.target.value)}
              className="w-full bg-input text-text-main rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary text-base appearance-none"
            >
              <option value="usuario">Jogador</option>
              <option value="admin">Administrador</option>
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>

          <p className="text-text-muted text-xs">
            Um email de confirmação será enviado. A conta já será criada como aprovada.
          </p>

          <button
            type="submit" disabled={loading}
            className="w-full bg-primary text-black font-bold py-3 rounded-xl disabled:opacity-50 active:scale-95 transition-transform"
          >
            {loading ? 'Criando...' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  )
}
