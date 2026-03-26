import { MessageCircle, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { deleteFeedPost } from '@/lib/api'

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function FeedCard({ post, isAdmin, onDeleted }) {
  const navigate = useNavigate()
  const commentCount = post.feed_comentarios?.[0]?.count ?? 0

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

      {/* Caption + comment button */}
      <div className="p-3">
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
