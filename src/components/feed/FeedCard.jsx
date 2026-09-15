import { useState } from 'react'
import { MessageCircle, Share2, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { deleteFeedPost } from '@/lib/api'
import { shareLink } from '@/lib/utils'
import { useReactions, ReactionBubbles, ReactionsSummaryButton, ReactionListModal } from '@/components/feed/Reactions'

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
  const [modalOpen, setModalOpen] = useState(false)
  const { reactions, sortedReactions, handleReact } = useReactions(post, userId)

  async function handleDelete() {
    if (!confirm('Remover publicação?')) return
    try {
      await deleteFeedPost(post.id)
      onDeleted?.(post.id)
    } catch (err) {
      console.error(err)
    }
  }

  function handleShare() {
    shareLink({
      url: `${window.location.origin}/feed/${post.id}`,
      title: 'Bagres FC',
      text: post.legenda ? `${post.profiles?.nome ?? ''}: ${post.legenda}` : `Foto de ${post.profiles?.nome ?? 'um jogador'} no Bagres FC`,
    }).catch(console.error)
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
      <div className="px-3 pt-2.5 pb-1">
        <ReactionBubbles
          sortedReactions={sortedReactions}
          pickerOpen={pickerOpen}
          setPickerOpen={setPickerOpen}
          onReact={handleReact}
        />
      </div>

      {/* Caption + comment button */}
      <div className="p-3 pt-1.5">
        {post.legenda && (
          <p className="text-text-main text-sm mb-2 leading-relaxed whitespace-pre-wrap">
            <span className="font-semibold mr-1">{post.profiles?.nome}</span>
            {post.legenda}
          </p>
        )}
        <div className="flex items-center gap-4">
          <ReactionsSummaryButton count={reactions.length} onClick={() => setModalOpen(true)} />
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
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-text-muted text-sm active:scale-95 transition-transform ml-auto"
          >
            <Share2 size={16} />
            <span>Compartilhar</span>
          </button>
        </div>
      </div>

      {/* Reaction list modal */}
      {modalOpen && reactions.length > 0 && (
        <ReactionListModal reactions={reactions} onClose={() => setModalOpen(false)} />
      )}
    </div>
  )
}
