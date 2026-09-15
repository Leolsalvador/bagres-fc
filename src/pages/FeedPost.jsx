import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Share2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { fetchFeedPost, fetchFeedComentarios, createFeedComentario } from '@/lib/api'
import { shareLink } from '@/lib/utils'

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

function Avatar({ profile, size = 'md' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-base' : 'w-10 h-10 text-xl'
  return (
    <div className={`${sz} rounded-full bg-card flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-primary/30`}>
      {profile?.foto_url
        ? <img src={profile.foto_url} alt={profile.nome} className="w-full h-full object-cover" />
        : <span>👤</span>
      }
    </div>
  )
}

export default function FeedPost() {
  const { postId } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [post, setPost] = useState(null)
  const [comentarios, setComentarios] = useState([])
  const [texto, setTexto] = useState('')
  const [sending, setSending] = useState(false)
  const [showImage, setShowImage] = useState(false)

  useEffect(() => {
    fetchFeedPost(postId).then(setPost).catch(console.error)
    fetchFeedComentarios(postId).then(setComentarios).catch(console.error)
  }, [postId])

  async function handleSend() {
    const t = texto.trim()
    if (!t || sending) return
    setSending(true)
    try {
      const novo = await createFeedComentario(postId, profile.id, t)
      setComentarios(prev => [...prev, novo])
      setTexto('')
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  function handleShare() {
    shareLink({
      url: `${window.location.origin}/feed/${postId}`,
      title: 'Bagres FC',
      text: post?.legenda ? `${post.profiles?.nome ?? ''}: ${post.legenda}` : `Foto de ${post?.profiles?.nome ?? 'um jogador'} no Bagres FC`,
    }).catch(console.error)
  }

  return (
    <div className="min-h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-10 pb-3">
        <button onClick={() => navigate(-1)} className="text-text-muted active:scale-90 transition-transform">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-text-main flex-1">Comentários</h1>
        <button onClick={handleShare} className="text-text-muted active:scale-90 transition-transform">
          <Share2 size={19} />
        </button>
      </div>

      {/* Post preview — foto e legenda em tamanho completo */}
      {post && (
        <div className="mx-4 mb-3 bg-card rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowImage(true)}
            className="w-full flex items-center justify-center bg-background active:opacity-90 transition-opacity"
          >
            <img
              src={post.imagem_url}
              alt={post.legenda ?? 'Post'}
              className="w-full object-contain"
            />
          </button>
          <div className="p-3">
            <p className="text-text-main text-xs font-semibold">{post.profiles?.nome}</p>
            {post.legenda && (
              <p className="text-text-muted text-xs mt-1 leading-relaxed whitespace-pre-wrap">{post.legenda}</p>
            )}
          </div>
        </div>
      )}

      {/* Imagem em tela cheia */}
      {showImage && post && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowImage(false)}
        >
          <img
            src={post.imagem_url}
            alt={post.legenda ?? 'Post'}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}

      {/* Comments */}
      <div className="flex flex-col gap-3 px-4 py-4">
        {comentarios.length === 0 && (
          <p className="text-text-muted text-sm text-center py-6">
            Nenhum comentário ainda. Seja o primeiro!
          </p>
        )}
        {comentarios.map(c => (
          <div key={c.id} className="flex gap-3">
            <Avatar profile={c.profiles} size="sm" />
            <div className="bg-card rounded-2xl px-3 py-2 flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-text-main text-xs font-semibold">{c.profiles?.nome ?? '—'}</span>
                <span className="text-text-muted text-[10px]">{timeAgo(c.created_at)}</span>
              </div>
              <p className="text-text-main text-sm mt-0.5 break-words whitespace-pre-wrap">{c.texto}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Comment input — segue o conteúdo, rola junto com a página */}
      <div className="mt-auto flex items-end gap-2 px-4 py-3 bg-[#111827] border-t border-[#1F2937]">
        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="Escreva um comentário..."
          rows={1}
          className="flex-1 bg-background text-text-main text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary resize-none leading-relaxed"
          style={{ maxHeight: '120px', overflowY: 'auto' }}
        />
        <button
          onClick={handleSend}
          disabled={!texto.trim() || sending}
          className="w-9 h-9 bg-primary rounded-full flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40 flex-shrink-0"
        >
          <Send size={16} className="text-black" />
        </button>
      </div>
    </div>
  )
}
