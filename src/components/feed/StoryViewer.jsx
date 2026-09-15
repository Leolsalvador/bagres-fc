import { useState, useEffect, useRef } from 'react'
import { X, Trash2 } from 'lucide-react'
import { deleteStory } from '@/lib/api'

const DURATION_MS = 5000

export default function StoryViewer({ groups, startIndex, currentUserId, onClose, onDeleted }) {
  const [groupIndex, setGroupIndex] = useState(startIndex)
  const [itemIndex, setItemIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const rafRef = useRef(null)
  const startRef = useRef(null)

  const group = groups[groupIndex]
  const item = group?.items[itemIndex]

  function goNext() {
    const g = groups[groupIndex]
    if (itemIndex < g.items.length - 1) {
      setItemIndex(i => i + 1)
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex(gi => gi + 1)
      setItemIndex(0)
    } else {
      onClose()
    }
  }

  function goPrev() {
    if (itemIndex > 0) {
      setItemIndex(i => i - 1)
    } else if (groupIndex > 0) {
      const prevGroup = groups[groupIndex - 1]
      setGroupIndex(gi => gi - 1)
      setItemIndex(prevGroup.items.length - 1)
    }
  }

  useEffect(() => {
    if (!item) { onClose(); return }
    setProgress(0)
    startRef.current = performance.now()
    function tick(now) {
      const elapsed = now - startRef.current
      const pct = Math.min(1, elapsed / DURATION_MS)
      setProgress(pct)
      if (pct >= 1) {
        goNext()
      } else {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [groupIndex, itemIndex]) // eslint-disable-line

  async function handleDelete() {
    if (!item || !confirm('Apagar este story?')) return
    try {
      await deleteStory(item.id, item.r2_key)
      onDeleted?.()
      goNext()
    } catch (err) {
      console.error(err)
    }
  }

  if (!group || !item) return null
  const isMine = item.autor_id === currentUserId

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Barras de progresso */}
      <div className="flex gap-1 px-3 pt-3 shrink-0" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
        {group.items.map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full bg-white/25 overflow-hidden">
            <div
              className="h-full bg-white"
              style={{ width: i < itemIndex ? '100%' : i === itemIndex ? `${progress * 100}%` : '0%' }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 shrink-0">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-elevated flex items-center justify-center shrink-0">
          {group.profile?.foto_url
            ? <img src={group.profile.foto_url} alt={group.profile.nome} className="w-full h-full object-cover" />
            : <span className="text-sm">👤</span>}
        </div>
        <span className="text-white text-sm font-semibold flex-1 truncate">{group.profile?.nome ?? '—'}</span>
        {isMine && (
          <button onClick={handleDelete} className="text-white/80 active:scale-90 transition-transform p-1.5">
            <Trash2 size={18} />
          </button>
        )}
        <button onClick={onClose} className="text-white/80 active:scale-90 transition-transform p-1.5">
          <X size={22} />
        </button>
      </div>

      {/* Imagem + áreas de toque pra navegar */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        <img src={item.imagem_url} alt="" className="max-w-full max-h-full object-contain" />
        <button onClick={goPrev} className="absolute left-0 top-0 bottom-0 w-1/3" aria-label="Anterior" />
        <button onClick={goNext} className="absolute right-0 top-0 bottom-0 w-1/3" aria-label="Próximo" />
      </div>
    </div>
  )
}
