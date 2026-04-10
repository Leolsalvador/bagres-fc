import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { deleteFeedPost, toggleReaction } from '@/lib/api'

const EMOJIS = ['❤️', '👍', '😂', '🔥', '😮', '👏', '🍆']

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function FeedCard({ post, isAdmin, userId, onDeleted }) {
  const navigate = useNavigate()
  const commentCount = post.feed_comentarios?.[0]?.count ?? 0
  const [pickerOpen, setPickerOpen] = useState(false)
  const [reactions, setReactions] = useState(post.feed_reactions ?? [])
  const pickerRef = useRef(null)

  // Close picker when tapping outside
  useEffect(() => {
    if (!pickerOpen) return
    function onOutside(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('touchstart', onOutside)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('touchstart', onOutside)
    }
  }, [pickerOpen])

  // Group reactions by emoji
  const grouped = {}
  for (const r of reactions) {
    if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, reacted: false }
    grouped[r.emoji].count++
    if (r.usuario_id === userId) grouped[r.emoji].reacted = true
  }
  const sortedReactions = Object.entries(grouped).sort((a, b) => b[1].count - a[1].count)

  async function handleReact(emoji) {
    if (!userId) return
    setPickerOpen(false)
    const alreadyReacted = grouped[emoji]?.reacted
    // Optimistic update
    setReactions(prev =>
      alreadyReacted
        ? prev.filter(r => !(r.usuario_id === userId && r.emoji === emoji))
        : [...prev, { usuario_id: userId, emoji }]
    )
    try {
      await toggleReaction(post.id, userId, emoji)
    } catch (err) {
      console.error(err)
      setReactions(post.feed_reactions ?? []) // revert
    }
  }

  async function handleDelete() {
    if (!confirm('Remover publicação?')) return
    try {
      await deleteFeedPost(post.id)
      onDeleted?.(post.id)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="bg-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-3">
        <div className="w-9 h-9 rounded-full bg-background flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-primary/30">
          {post.profiles?.foto_url
            ? <img src={post.profiles.foto_url} alt={post.profiles.nome} className="w-full h-full object-cover" />
            : <span className="text-xl">👤</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-text-main text-sm font-semibold truncate">{post.profiles?.nome ?? '—'}</p>
          <p className="text-text-muted text-xs">{timeAgo(post.created_at)}</p>
        </div>
        {isAdmin && (
          <button onClick={handleDelete} className="text-text-muted active:scale-90 transition-transform p-1">
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Image — 4:5 aspect ratio */}
      <div className="aspect-[4/5] w-full bg-background">
        <img
          src={post.imagem_url}
          alt={post.legenda ?? 'Post'}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Reactions */}
      <div className="px-3 pt-2.5 pb-1" ref={pickerRef}>
        {/* Emoji picker pill */}
        {pickerOpen && (
          <div className="flex items-center gap-0.5 bg-[#111827] border border-white/10 rounded-full px-2 py-1 w-fit mb-2 shadow-lg">
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => handleReact(e)}
                className="text-[22px] p-1 active:scale-75 transition-transform leading-none select-none"
              >
                {e}
              </button>
            ))}
          </div>
        )}

        {/* Reaction bubbles + open-picker button */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {sortedReactions.map(([emoji, { count, reacted }]) => (
            <button
              key={emoji}
              onClick={() => handleReact(emoji)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-sm transition-colors active:scale-90 ${
                reacted
                  ? 'bg-primary/15 border-primary/40'
                  : 'bg-[#1F2937] border-white/10'
              }`}
            >
              <span className="leading-none">{emoji}</span>
              <span className={`text-xs font-medium ${reacted ? 'text-primary' : 'text-text-muted'}`}>{count}</span>
            </button>
          ))}
          <button
            onClick={() => setPickerOpen(v => !v)}
            className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors ${
              pickerOpen ? 'bg-primary/15 border-primary/40' : 'bg-[#1F2937] border-white/10'
            }`}
          >
            <span className="text-sm leading-none select-none">😊</span>
          </button>
        </div>
      </div>

      {/* Caption + comment button */}
      <div className="p-3 pt-1.5">
        {post.legenda && (
          <p className="text-text-main text-sm mb-2 leading-relaxed">
            <span className="font-semibold mr-1">{post.profiles?.nome}</span>
            {post.legenda}
          </p>
        )}
        <button
          onClick={() => navigate(`/feed/${post.id}`)}
          className="flex items-center gap-1.5 text-text-muted text-sm active:scale-95 transition-transform"
        >
          <MessageCircle size={17} />
          <span>
            {commentCount > 0
              ? `${commentCount} comentário${commentCount !== 1 ? 's' : ''}`
              : 'Comentar'}
          </span>
        </button>
      </div>
    </div>
  )
}
