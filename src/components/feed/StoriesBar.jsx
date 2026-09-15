import { useState, useEffect, useRef } from 'react'
import { Plus, Camera, Image as ImageIcon, X } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { fetchActiveStories, createStory, cleanupExpiredStories } from '@/lib/api'
import StoryViewer from './StoryViewer'

export default function StoriesBar({ userId }) {
  const [stories, setStories] = useState([])
  const [uploading, setUploading] = useState(false)
  const [viewerGroupIndex, setViewerGroupIndex] = useState(null)
  const [showPicker, setShowPicker] = useState(false)
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

  async function handleFile(e) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (f.size > 20 * 1024 * 1024) { alert('Imagem muito grande. Máximo 20 MB.'); return }
    setUploading(true)
    try {
      const compressed = await imageCompression(f, {
        maxSizeMB: 0.4,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      })
      await createStory(userId, compressed)
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
    </div>
  )
}
