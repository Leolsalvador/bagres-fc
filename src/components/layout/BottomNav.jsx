import { NavLink } from 'react-router-dom'
import { Home, CalendarDays, Star, User, Newspaper, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useCampeonato } from '@/context/CampeonatoContext'

const JOGADOR_ITEMS = [
  { to: '/home',    icon: Home,        label: 'Início'  },
  { to: '/rodada',  icon: CalendarDays, label: 'Rodada'  },
  { to: '/feed',    icon: Newspaper,    label: 'Feed'    },
  { to: '/votacao', icon: Star,         label: 'Votar'   },
  { to: '/perfil',  icon: User,         label: 'Perfil'  },
]

const TELESPECTADOR_ITEMS = [
  { to: '/feed',       icon: Newspaper, label: 'Feed'       },
  { to: '/campeonato', icon: Trophy,    label: 'Campeonato' },
]

export default function BottomNav() {
  const { isTelespectador } = useAuth()
  const { campeonato } = useCampeonato()

  const campeonatoAtivo = !!campeonato

  let items = isTelespectador ? TELESPECTADOR_ITEMS : JOGADOR_ITEMS

  // Adiciona aba Campeonato para jogadores quando há campeonato ativo
  if (!isTelespectador && campeonatoAtivo) {
    items = [
      ...items.slice(0, 3),
      { to: '/campeonato', icon: Trophy, label: 'Copa' },
      ...items.slice(3),
    ]
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#111827] border-t border-[#1F2937]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors min-w-[44px]',
                isActive ? 'text-primary' : 'text-text-muted'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
