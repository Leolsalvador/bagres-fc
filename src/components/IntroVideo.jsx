import { useState, useEffect, useRef } from 'react'

export default function IntroVideo() {
  const [visible, setVisible] = useState(false)
  const videoRef = useRef(null)

  useEffect(() => {
    // Mostra apenas uma vez por sessão
    if (!sessionStorage.getItem('intro_shown')) {
      setVisible(true)
      sessionStorage.setItem('intro_shown', '1')
    }
  }, [])

  function dismiss() {
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onClick={dismiss}
    >
      <video
        ref={videoRef}
        src="/intro.mp4"
        autoPlay
        playsInline
        muted={false}
        className="w-full h-full object-cover"
        onEnded={dismiss}
      />
      <button
        onClick={dismiss}
        className="absolute top-10 right-5 text-white/60 text-sm font-semibold bg-black/40 px-3 py-1.5 rounded-full"
      >
        Pular
      </button>
    </div>
  )
}
