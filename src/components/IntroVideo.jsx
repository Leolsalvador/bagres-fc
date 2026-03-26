import { useState, useEffect, useRef } from 'react'

export default function IntroVideo() {
  const [visible, setVisible] = useState(() => {
    if (sessionStorage.getItem('intro-shown')) return false
    sessionStorage.setItem('intro-shown', '1')
    return true
  })
  const [started, setStarted] = useState(false)
  const videoRef = useRef(null)

  function dismiss() {
    setVisible(false)
    window.dispatchEvent(new Event('intro-done'))
  }

  // Fecha após 8 segundos do início
  useEffect(() => {
    if (!started) return
    const t = setTimeout(dismiss, 8500)
    return () => clearTimeout(t)
  }, [started])

  function handleStart() {
    if (started || !videoRef.current) return
    videoRef.current.muted = false
    videoRef.current.play().catch(() => {})
    setStarted(true)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 bg-black" onClick={handleStart}>
      <video
        ref={videoRef}
        src="/intro.mp4"
        playsInline
        muted
        loop
        className="w-full h-full object-cover"
        onError={dismiss}
      />

      {/* Overlay de toque — some quando o vídeo começa */}
      {!started && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
          <img src="/logo.png" alt="Bagres FC" className="w-28 h-28 rounded-full" />
          <p className="text-white font-bold text-lg tracking-widest animate-pulse">TOQUE PARA COMEÇAR</p>
        </div>
      )}

      {/* Botão pular — sempre visível após iniciar */}
      {started && (
        <button
          onClick={e => { e.stopPropagation(); dismiss() }}
          className="absolute bottom-8 right-6 px-4 py-2 rounded-full bg-black/50 text-white text-sm font-semibold border border-white/30 active:scale-95 transition-transform"
        >
          Pular
        </button>
      )}
    </div>
  )
}
