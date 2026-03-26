import { useState, useEffect, useRef } from 'react'

export default function IntroVideo() {
  const [visible, setVisible] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const videoRef = useRef(null)

  useEffect(() => {
    if (!sessionStorage.getItem('intro_shown')) {
      setVisible(true)
      sessionStorage.setItem('intro_shown', '1')
    }
  }, [])

  // Fallback: fecha após 8 segundos caso o vídeo não carregue
  useEffect(() => {
    if (!visible) return
    const t = setTimeout(dismiss, 8000)
    return () => clearTimeout(t)
  }, [visible])

  function dismiss() {
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <video
        ref={videoRef}
        src="/intro.mp4"
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        onCanPlay={() => setVideoReady(true)}
        onEnded={dismiss}
        onError={dismiss}
      />

      {/* Mostra logo enquanto o vídeo carrega */}
      {!videoReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <img src="/logo.png" alt="Bagres FC" className="w-24 h-24 rounded-full" />
        </div>
      )}

      <button
        onClick={dismiss}
        className="absolute top-10 right-5 text-white text-sm font-bold bg-black/60 border border-white/20 px-4 py-2 rounded-full"
      >
        Pular
      </button>
    </div>
  )
}
