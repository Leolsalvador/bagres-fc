import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const STORAGE_KEY = 'pwa_install_dismissed'

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true
}

function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

const STEPS_IOS = [
  { icon: '1', text: 'Toque no ícone de compartilhar', sub: '(barra inferior do Safari)' },
  { icon: '2', text: 'Role e toque em "Adicionar à Tela de Início"', sub: null },
  { icon: '3', text: 'Toque em "Adicionar" no canto superior direito', sub: null },
]

const STEPS_ANDROID = [
  { icon: '1', text: 'Toque nos três pontos no canto superior direito', sub: '(menu do Chrome)' },
  { icon: '2', text: 'Toque em "Adicionar à tela inicial"', sub: null },
  { icon: '3', text: 'Confirme tocando em "Adicionar"', sub: null },
]

export default function InstallPWA() {
  const [visible, setVisible] = useState(false)
  const ios = isIOS()

  useEffect(() => {
    if (isStandalone()) return
    if (!isMobile()) return
    if (localStorage.getItem(STORAGE_KEY)) return

    const timer = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  const steps = ios ? STEPS_IOS : STEPS_ANDROID

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={dismiss} />

      {/* Sheet */}
      <div className="relative bg-card rounded-t-3xl px-6 pt-5 pb-8 animate-in slide-in-from-bottom-4 duration-300">
        {/* Handle */}
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

        {/* Close */}
        <button onClick={dismiss} className="absolute top-5 right-5 text-text-muted active:opacity-70">
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <img src="/logo.png" alt="Bagres FC" className="w-12 h-12 rounded-2xl object-cover" />
          <div>
            <p className="text-text-main font-black text-base">Instale o Bagres FC</p>
            <p className="text-text-muted text-xs">Acesse direto da tela inicial</p>
          </div>
        </div>

        {/* Passos */}
        <div className="space-y-4 mb-6">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/20 text-primary font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                {step.icon}
              </div>
              <div>
                <p className="text-text-main text-sm">{step.text}</p>
                {step.sub && <p className="text-text-muted text-xs mt-0.5">{step.sub}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Botão */}
        <button
          onClick={dismiss}
          className="w-full bg-primary text-black font-bold py-3.5 rounded-2xl active:scale-95 transition-transform"
        >
          Entendi, vou instalar!
        </button>

        <button onClick={dismiss} className="w-full text-text-muted text-xs mt-3 py-1 active:opacity-70">
          Agora não
        </button>
      </div>
    </div>
  )
}
