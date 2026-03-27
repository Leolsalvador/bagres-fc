import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { fetchFeedPost, fetchFeedComentarios, createFeedComentario } from '@/lib/api'

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

  return (
    <div className="flex flex-col bg-background" style={{ height: 'calc(100dvh - 64px)' }}>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 pt-10 pb-3">
        <button onClick={() => navigate(-1)} className="text-text-muted active:scale-90 transition-transform">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-text-main">Comentários</h1>
      </div>

      {/* Post preview — compact landscape crop */}
      {post && (
        <div className="flex-shrink-0 mx-4 mb-4 bg-card rounded-2xl overflow-hidden">
          <div className="w-full h-48 bg-background">
            <img
              src={post.imagem_url}
              alt={post.legenda ?? 'Post'}
              className="w-full h-full object-cover"
            />
          </div>
          {post.legenda && (
            <div className="flex gap-2 items-start p-3">
              <Avatar profile={post.profiles} size="sm" />
              <p className="text-text-main text-sm leading-relaxed">
                <span className="font-semibold mr-1">{post.profiles?.nome}</span>
                {post.legenda}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Comments — scrollable area */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 px-4 py-4">
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
              <p className="text-text-main text-sm mt-0.5 break-words">{c.texto}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Comment input — fixed at bottom */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3 bg-[#111827] border-t border-[#1F2937]">
        <input
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Escreva um comentário..."
          className="flex-1 bg-background text-text-main text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
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
