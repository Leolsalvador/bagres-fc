import { useState, useRef } from 'react'
import { X, ImagePlus, FlipHorizontal } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { createFeedPost, fetchApprovedProfiles, sendPushNotification } from '@/lib/api'
import { flipImageHorizontally } from '@/lib/flipImage'

export default function NovoPostModal({ autorId, onClose, onCreated }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [legenda, setLegenda] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [flipping, setFlipping] = useState(false)
  const fileRef = useRef(null)

  async function handleFlip() {
    if (!file) return
    setFlipping(true)
    try {
      const flipped = await flipImageHorizontally(file)
      setFile(flipped)
      setPreview(URL.createObjectURL(flipped))
    } catch (err) {
      console.error(err)
    } finally {
      setFlipping(false)
    }
  }

  function handleFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 20 * 1024 * 1024) {
      setError('Imagem muito grande. Máximo 20 MB.')
      return
    }
    setPreview(URL.createObjectURL(f))
    setFile(f)
    setError('')
  }

  async function handleSubmit() {
    if (!file) { setError('Selecione uma imagem.'); return }
    setSaving(true)
    setError('')
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1080,
        useWebWorker: true,
      })
      const caption = legenda.trim()
      const post = await createFeedPost(autorId, caption || null, compressed)
      onCreated(post)
      onClose()
      // Notifica todos os aprovados (sem bloquear o fluxo)
      fetchApprovedProfiles()
        .then(profiles => {
          const userIds = profiles.map(p => p.id).filter(id => id !== autorId)
          return sendPushNotification({
            title: '📸 Nova publicação no Feed',
            body: caption || 'O admin publicou uma nova foto!',
            userIds,
          })
        })
        .catch(() => {})
    } catch (err) {
      console.error(err)
      setError('Erro ao publicar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-card rounded-t-2xl p-4 pb-24"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text-main font-bold text-base">Nova publicação</h2>
          <button onClick={onClose} className="text-text-muted active:scale-90">
            <X size={20} />
          </button>
        </div>

        {/* Image area */}
        {preview ? (
          <div className="aspect-[4/5] w-full bg-background rounded-xl overflow-hidden mb-2">
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full aspect-[4/5] bg-background rounded-xl flex flex-col items-center justify-center gap-3 text-text-muted mb-2 active:scale-[0.98] transition-transform border-2 border-dashed border-[#1F2937]"
          >
            <ImagePlus size={40} />
            <span className="text-sm font-medium">Toque para escolher foto</span>
          </button>
        )}

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

        {preview && (
          <div className="flex items-center gap-4 mb-3">
            <button
              onClick={() => fileRef.current?.click()}
              className="text-primary text-xs font-medium"
            >
              Trocar foto
            </button>
            <button
              onClick={handleFlip}
              disabled={flipping}
              className="flex items-center gap-1 text-primary text-xs font-medium disabled:opacity-50"
            >
              <FlipHorizontal size={13} /> {flipping ? 'Espelhando...' : 'Espelhar (foto invertida?)'}
            </button>
          </div>
        )}

        {/* Caption */}
        <textarea
          value={legenda}
          onChange={e => setLegenda(e.target.value)}
          placeholder="Escreva uma legenda... (opcional)"
          rows={2}
          className="w-full bg-background text-text-main text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary resize-none mb-3 mt-2"
        />

        {error && <p className="text-danger text-xs mb-3">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={saving || !file}
          className="w-full py-3 bg-primary text-black font-bold rounded-xl active:scale-95 transition-transform disabled:opacity-40"
        >
          {saving ? 'Publicando...' : 'Publicar'}
        </button>
      </div>
    </div>
  )
}
