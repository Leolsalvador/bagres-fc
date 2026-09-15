import { useState, useEffect, useRef } from 'react'
import { Plus, Camera, Image as ImageIcon, X, FlipHorizontal } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { fetchActiveStories, createStory, cleanupExpiredStories } from '@/lib/api'
import { flipImageHorizontally } from '@/lib/flipImage'
import StoryViewer from './StoryViewer'

export default function StoriesBar({ userId }) {
  const [stories, setStories] = useState([])
  const [uploading, setUploading] = useState(false)
  const [viewerGroupIndex, setViewerGroupIndex] = useState(null)
  const [showPicker, setShowPicker] = useState(false)
  const [previewFile, setPreviewFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [flipping, setFlipping] = useState(false)
  const cameraRef = useRef(null)
  const galleryRef = useRef(null)

  useEffect(() => {
    load()
    cleanupExpiredStories().catch(() => {})
  }, [])

  async function load() {
    try {
      const data = await fetchActiveStories()
      setStories(data)
    } catch (err) {
      console.error('Erro ao carregar stories:', err)
    }
  }

  // Agrupa por autor — cada grupo é os stories daquela pessoa, em ordem cronológica
  const groups = []
  const byAuthor = {}
  stories.forEach(s => {
    if (!byAuthor[s.autor_id]) {
      byAuthor[s.autor_id] = { autor_id: s.autor_id, profile: s.profiles, items: [] }
      groups.push(byAuthor[s.autor_id])
    }
    byAuthor[s.autor_id].items.push(s)
  })
  // Grupos com story mais recente primeiro
  groups.sort((a, b) => {
    const lastA = a.items[a.items.length - 1].created_at
    const lastB = b.items[b.items.length - 1].created_at
    return new Date(lastB) - new Date(lastA)
  })

  const myGroupIndex = groups.findIndex(g => g.autor_id === userId)
  const others = groups.filter((_, i) => i !== myGroupIndex)

  function handleFile(e) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (f.size > 20 * 1024 * 1024) { alert('Imagem muito grande. Máximo 20 MB.'); return }
    setPreviewFile(f)
    setPreviewUrl(URL.createObjectURL(f))
  }

  async function handleFlipPreview() {
    if (!previewFile) return
    setFlipping(true)
    try {
      const flipped = await flipImageHorizontally(previewFile)
      setPreviewFile(flipped)
      setPreviewUrl(URL.createObjectURL(flipped))
    } catch (err) {
      console.error(err)
    } finally {
      setFlipping(false)
    }
  }

  function cancelPreview() {
    setPreviewFile(null)
    setPreviewUrl(null)
  }

  async function handlePublish() {
    if (!previewFile) return
    setUploading(true)
    try {
      const compressed = await imageCompression(previewFile, {
        maxSizeMB: 0.4,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      })
      await createStory(userId, compressed)
      cancelPreview()
      await load()
    } catch (err) {
      console.error(err)
      alert('Erro ao publicar story. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  function openPicker() {
    setShowPicker(true)
  }

  return (
    <div className="flex gap-3 overflow-x-auto px-4 pb-3 pt-1 -mb-1">
      {/* Seu story */}
      <div className="flex flex-col items-center gap-1 shrink-0 w-16">
        <button
          onClick={() => myGroupIndex >= 0 ? setViewerGroupIndex(myGroupIndex) : openPicker()}
          disabled={uploading}
          className="relative w-16 h-16 rounded-full active:scale-95 transition-transform disabled:opacity-60"
        >
          {myGroupIndex >= 0 ? (
            <div className="w-full h-full rounded-full ring-2 ring-primary p-0.5">
              <div className="w-full h-full rounded-full overflow-hidden bg-elevated flex items-center justify-center">
                {groups[myGroupIndex].profile?.foto_url
                  ? <img src={groups[myGroupIndex].profile.foto_url} alt="" className="w-full h-full object-cover" />
                  : <span className="text-xl">👤</span>}
              </div>
            </div>
          ) : (
            <div className="w-full h-full rounded-full bg-elevated flex items-center justify-center border-2 border-dashed border-border">
              <Plus size={22} className="text-text-muted" />
            </div>
          )}
          {myGroupIndex >= 0 && (
            <span
              onClick={e => { e.stopPropagation(); openPicker() }}
              className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center ring-2 ring-background"
            >
              <Plus size={12} className="text-black" />
            </span>
          )}
        </button>
        <span className="text-[10px] text-text-muted truncate w-full text-center">
          {uploading ? 'Enviando...' : 'Seu story'}
        </span>
      </div>

      {/* Stories de outras pessoas */}
      {others.map(g => (
        <button
          key={g.autor_id}
          onClick={() => setViewerGroupIndex(groups.indexOf(g))}
          className="flex flex-col items-center gap-1 shrink-0 w-16 active:scale-95 transition-transform"
        >
          <div className="w-16 h-16 rounded-full ring-2 ring-primary p-0.5">
            <div className="w-full h-full rounded-full overflow-hidden bg-elevated flex items-center justify-center">
              {g.profile?.foto_url
                ? <img src={g.profile.foto_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-xl">👤</span>}
            </div>
          </div>
          <span className="text-[10px] text-text-muted truncate w-full text-center">
            {g.profile?.nome?.split(' ')[0] ?? '—'}
          </span>
        </button>
      ))}

      {/* Input com capture=environment: no celular abre a câmera direto */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      {/* Input normal: abre a galeria */}
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {/* Escolha rápida: tirar foto ou escolher da galeria */}
      {showPicker && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end" onClick={() => setShowPicker(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-card rounded-t-2xl p-4 pb-8 mb-16 space-y-2" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-2" />
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-text-main font-bold text-base">Novo story</h3>
              <button onClick={() => setShowPicker(false)} className="text-text-muted active:scale-90">
                <X size={20} />
              </button>
            </div>
            <button
              onClick={() => { setShowPicker(false); cameraRef.current?.click() }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-elevated active:scale-[0.98] transition-transform"
            >
              <Camera size={20} className="text-primary" />
              <span className="text-text-main font-semibold text-sm">Tirar foto</span>
            </button>
            <button
              onClick={() => { setShowPicker(false); galleryRef.current?.click() }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-elevated active:scale-[0.98] transition-transform"
            >
              <ImageIcon size={20} className="text-primary" />
              <span className="text-text-main font-semibold text-sm">Escolher da galeria</span>
            </button>
          </div>
        </div>
      )}

      {viewerGroupIndex !== null && groups[viewerGroupIndex] && (
        <StoryViewer
          groups={groups}
          startIndex={viewerGroupIndex}
          currentUserId={userId}
          onClose={() => setViewerGroupIndex(null)}
          onDeleted={load}
        />
      )}

      {/* Pré-visualização antes de publicar — permite espelhar se a foto veio invertida */}
      {previewUrl && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 py-3" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
            <h3 className="text-white font-bold text-base">Novo story</h3>
            <button onClick={cancelPreview} className="text-white/80 active:scale-90 transition-transform">
              <X size={22} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-hidden px-4">
            <img src={previewUrl} alt="preview" className="max-w-full max-h-full object-contain rounded-lg" />
          </div>
          <div className="px-4 pb-8 pt-3 space-y-2">
            <button
              onClick={handleFlipPreview}
              disabled={flipping || uploading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 text-white text-sm font-semibold active:scale-95 transition-transform disabled:opacity-50"
            >
              <FlipHorizontal size={16} /> {flipping ? 'Espelhando...' : 'Espelhar (foto invertida?)'}
            </button>
            <button
              onClick={handlePublish}
              disabled={uploading || flipping}
              className="w-full py-3.5 rounded-xl bg-primary text-black font-bold active:scale-95 transition-transform disabled:opacity-50"
            >
              {uploading ? 'Publicando...' : 'Publicar story'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
