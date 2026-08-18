import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Estilo do "escudo" (badge circular) de um time — bicolor quando há cor_secundaria
export function teamDotStyle(time) {
  if (time?.cor_secundaria) {
    return { background: `linear-gradient(135deg, ${time.cor} 50%, ${time.cor_secundaria} 50%)` }
  }
  return { background: time?.cor ?? '#6B7280' }
}
