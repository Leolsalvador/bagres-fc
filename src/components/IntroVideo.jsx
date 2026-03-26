import { useState, useEffect, useRef } from 'react'

export default function IntroVideo() {
  const [visible, setVisible] = useState(false)
  const videoRef = useRef(null)

  useEffect(() => {
    if (!sessionStorage.getItem('intro_shown')) {
      setVisible(true)
      sessionStorage.setItem('intro_shown', '1')
    }
  }, [])

  // Fecha após 8 segundos
  useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => setVisible(false), 8000)
    return () => clearTimeout(t)
  }, [visible])

  // Força play assim que o elemento existir
  useEffect(() => {
    if (!visible || !videoRef.current) return
    videoRef.current.play().catch(() => {})
  }, [visible])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <video
        ref={videoRef}
        src="/intro.mp4"
        autoPlay
        playsInline
        muted
        loop
        className="w-full h-full object-cover"
        onError={() => setVisible(false)}
      />
    </div>
  )
}
