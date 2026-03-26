import { useState, useEffect, useRef } from 'react'
import { Plus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { fetchFeedPosts } from '@/lib/api'
import FeedCard from '@/components/feed/FeedCard'
import NovoPostModal from '@/components/feed/NovoPostModal'

const PAGE_SIZE = 5

export default function Feed() {
  const { profile } = useAuth()
  const isAdmin = profile?.papel === 'admin'

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const pageRef = useRef(0)
  const loadingRef = useRef(false)
  const hasMoreRef = useRef(true)
  const sentinelRef = useRef(null)

  async function loadNext() {
    if (loadingRef.current || !hasMoreRef.current) return
    loadingRef.current = true
    setLoading(true)
    const p = pageRef.current
    try {
      const data = await fetchFeedPosts(p)
      setPosts(prev => p === 0 ? data : [...prev, ...data])
      if (data.length < PAGE_SIZE) {
        hasMoreRef.current = false
        setHasMore(false)
      } else {
        pageRef.current++
      }
    } catch (err) {
      console.error('fetchFeedPosts error:', err)
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }

  // Capture latest loadNext so observer callback always calls the current version
  const loadNextRef = useRef(loadNext)
  loadNextRef.current = loadNext

  useEffect(() => {
    loadNextRef.current()
  }, [])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadNextRef.current() },
      { rootMargin: '200px' }
    )
    obs.observe(sentinel)
    return () => obs.disconnect()
  }, [])

  function handleCreated(post) {
    setPosts(prev => [post, ...prev])
  }

  function handleDeleted(postId) {
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-10 pb-4">
        <h1 className="text-2xl font-black text-text-main uppercase tracking-widest">Feed</h1>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="w-9 h-9 bg-primary rounded-full flex items-center justify-center active:scale-90 transition-transform"
          >
            <Plus size={20} className="text-black" />
          </button>
        )}
      </div>

      {/* Posts */}
      <div className="flex flex-col gap-4 px-4 pb-6">
        {posts.map(post => (
          <FeedCard
            key={post.id}
            post={post}
            isAdmin={isAdmin}
            onDeleted={handleDeleted}
          />
        ))}

        {/* Infinite scroll sentinel */}
        {hasMore && <div ref={sentinelRef} className="h-4" />}

        {loading && (
          <p className="text-text-muted text-xs text-center py-3">Carregando...</p>
        )}

        {!hasMore && posts.length > 0 && (
          <p className="text-text-muted text-xs text-center py-3">— Fim do feed —</p>
        )}

        {!loading && posts.length === 0 && !hasMore && (
          <div className="flex flex-col items-center py-20 gap-3">
            <span className="text-5xl">📸</span>
            <p className="text-text-muted text-sm text-center">Nenhuma publicação ainda.</p>
            {isAdmin && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-2 px-5 py-2.5 bg-primary text-black font-bold rounded-xl text-sm active:scale-95 transition-transform"
              >
                Criar primeira publicação
              </button>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <NovoPostModal
          autorId={profile?.id}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
