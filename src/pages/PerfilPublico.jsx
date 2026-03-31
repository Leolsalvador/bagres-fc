import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, Target, Handshake, Shirt, Pencil, Check, X } from 'lucide-react'
import { fetchProfileById, updatePlayerStats } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const POSICAO_COLOR = {
  ATA: 'bg-red-500/20 text-red-400',
  MEI: 'bg-blue-500/20 text-blue-400',
  ZAG: 'bg-yellow-500/20 text-yellow-400',
  GOL: 'bg-purple-500/20 text-purple-400',
  CORINGA: 'bg-primary/20 text-primary',
}

const POSICAO_LABEL = {
  ATA: 'Atacante', MEI: 'Meia', ZAG: 'Zagueiro', GOL: 'Goleiro', CORINGA: 'Coringa',
}

export default function PerfilPublico() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile: currentProfile } = useAuth()
  const isAdmin = currentProfile?.papel === 'admin'
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editValues, setEditValues] = useState({ gols: 0, assistencias: 0, jogos: 0 })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    fetchProfileById(id)
      .then(setPlayer)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-full bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!player) {
    return (
      <div className="min-h-full bg-background flex flex-col items-center justify-center gap-3 px-4">
        <p className="text-text-main font-semibold">Jogador não encontrado</p>
        <button onClick={() => navigate(-1)} className="text-primary text-sm font-semibold">
          ← Voltar
        </button>
      </div>
    )
  }

  const stats = [
    { label: 'Gols',    value: player.gols ?? 0,         icon: Target,    color: 'text-primary'   },
    { label: 'Assist.', value: player.assistencias ?? 0,  icon: Handshake, color: 'text-primary'   },
    { label: 'Jogos',   value: player.jogos ?? 0,         icon: Shirt,     color: 'text-text-muted' },
    { label: 'Rating',  value: player.rating ? player.rating.toFixed(1) : '—', icon: Star, color: 'text-secondary' },
  ]

  const mediaGols = player.jogos > 0 ? (player.gols / player.jogos).toFixed(2) : '—'
  const mediaAssist = player.jogos > 0 ? (player.assistencias / player.jogos).toFixed(2) : '—'

  function handleStartEdit() {
    setEditValues({ gols: player.gols ?? 0, assistencias: player.assistencias ?? 0, jogos: player.jogos ?? 0 })
    setSaveError(null)
    setEditing(true)
  }

  function handleCancelEdit() {
    setEditing(false)
    setSaveError(null)
  }

  async function handleSaveStats() {
    setSaving(true)
    setSaveError(null)
    try {
      const parsed = {
        gols: parseInt(editValues.gols, 10) || 0,
        assistencias: parseInt(editValues.assistencias, 10) || 0,
        jogos: parseInt(editValues.jogos, 10) || 0,
      }
      await updatePlayerStats(id, parsed)
      setPlayer(prev => ({ ...prev, ...parsed }))
      setEditing(false)
    } catch (e) {
      setSaveError('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-full bg-background pb-8">
      {/* Header */}
      <div className="px-4 pt-10 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-card flex items-center justify-center active:scale-90 transition-transform shrink-0"
        >
          <ArrowLeft size={18} className="text-text-main" />
        </button>
        <h1 className="text-2xl font-black text-text-main uppercase tracking-widest">Perfil</h1>
      </div>

      {/* Avatar + nome */}
      <div className="flex flex-col items-center py-6 px-4">
        <div className="w-28 h-28 rounded-full bg-card flex items-center justify-center overflow-hidden ring-2 ring-primary mb-4">
          {player.foto_url
            ? <img src={player.foto_url} alt={player.nome} className="w-full h-full object-contain" />
            : <span className="text-6xl">👤</span>}
        </div>

        <p className="text-text-main font-black text-2xl text-center">{player.nome}</p>

        <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
          {player.posicao_campo && (
            <span className={cn('text-xs font-bold px-3 py-1 rounded-full', POSICAO_COLOR[player.posicao_campo])}>
              {POSICAO_LABEL[player.posicao_campo]}
            </span>
          )}
          <span className={cn(
            'text-xs font-bold px-3 py-1 rounded-full',
            player.papel === 'admin' ? 'bg-secondary/20 text-secondary' : 'bg-elevated text-text-muted'
          )}>
            {player.papel === 'admin' ? 'Administrador' : 'Jogador'}
          </span>
        </div>

        {/* Rating em destaque */}
        <div className="flex items-center gap-1.5 mt-4 bg-secondary/10 px-5 py-2 rounded-full">
          <Star size={16} className="text-secondary fill-secondary" />
          <span className="text-secondary font-black text-lg">
            {player.rating ? player.rating.toFixed(1) : '—'}
          </span>
          <span className="text-text-muted text-xs">rating</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mx-4 mb-6">
        <StatCard label="Gols" value={player.gols ?? 0} icon={Target} />
        <StatCard label="Assist." value={player.assistencias ?? 0} icon={Handshake} />
        <StatCard label="Jogos" value={player.jogos ?? 0} icon={Shirt} />
      </div>

      {/* Médias por jogo */}
      {player.jogos > 0 && (
        <div className="mx-4 bg-card rounded-2xl p-4">
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-3">Médias por jogo</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-text-main text-sm">Gols por jogo</p>
              <p className="text-primary font-bold">{mediaGols}</p>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between">
              <p className="text-text-main text-sm">Assistências por jogo</p>
              <p className="text-primary font-bold">{mediaAssist}</p>
            </div>
          </div>
        </div>
      )}

      {/* Admin: edição manual de estatísticas */}
      {isAdmin && (
        <div className="mx-4 mt-6 bg-card rounded-2xl p-4 border border-secondary/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-secondary text-xs font-bold uppercase tracking-wider">Admin</p>
              <p className="text-text-main text-sm font-semibold">Editar estatísticas</p>
            </div>
            {!editing && (
              <button
                onClick={handleStartEdit}
                className="flex items-center gap-1.5 bg-secondary/10 text-secondary text-xs font-bold px-3 py-1.5 rounded-full active:scale-90 transition-transform"
              >
                <Pencil size={13} />
                Editar
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-3">
              {[
                { key: 'gols', label: 'Gols', icon: Target },
                { key: 'assistencias', label: 'Assistências', icon: Handshake },
                { key: 'jogos', label: 'Jogos', icon: Shirt },
              ].map(({ key, label, icon: Icon }) => (
                <div key={key} className="flex items-center gap-3">
                  <Icon size={16} className="text-text-muted shrink-0" />
                  <p className="text-text-main text-sm flex-1">{label}</p>
                  <input
                    type="number"
                    min={0}
                    value={editValues[key]}
                    onChange={e => setEditValues(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-20 bg-elevated text-text-main text-sm font-bold text-center rounded-lg px-2 py-1.5 border border-border focus:border-secondary focus:outline-none"
                  />
                </div>
              ))}

              {saveError && (
                <p className="text-danger text-xs text-center">{saveError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-elevated text-text-muted text-sm font-bold py-2 rounded-xl active:scale-95 transition-transform"
                >
                  <X size={15} />
                  Cancelar
                </button>
                <button
                  onClick={handleSaveStats}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-secondary text-background text-sm font-bold py-2 rounded-xl active:scale-95 transition-transform disabled:opacity-60"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check size={15} />
                      Salvar
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Gols', value: player.gols ?? 0 },
                { label: 'Assist.', value: player.assistencias ?? 0 },
                { label: 'Jogos', value: player.jogos ?? 0 },
              ].map(({ label, value }) => (
                <div key={label} className="bg-elevated rounded-xl p-3 text-center">
                  <p className="text-text-main font-black text-xl">{value}</p>
                  <p className="text-text-muted text-xs">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="bg-card rounded-2xl p-4 flex flex-col items-center gap-1.5">
      <Icon size={20} className="text-primary" />
      <p className="text-text-main font-black text-2xl">{value}</p>
      <p className="text-text-muted text-xs">{label}</p>
    </div>
  )
}
