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

// Chave estável de um jogador do campeonato — funciona tanto pra jogador com conta
// quanto pra convidado (identificado pela linha dele em campeonato_time_jogadores)
export function playerKey(j) {
  if (!j) return null
  return j.is_guest ? `g:${j.tj_id}` : j.id
}

// Mesma chave a partir de um evento/voto (campeonato_eventos ou campeonato_votos_mvp)
export function eventPlayerKey(e) {
  if (!e) return null
  return e.is_guest ? `g:${e.guest_time_jogador_id}` : e.jogador_id
}
