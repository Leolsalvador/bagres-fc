import { NavLink } from 'react-router-dom'
import { Home, CalendarDays, Star, User, Newspaper } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/home',    icon: Home,        label: 'Início'  },
  { to: '/rodada',  icon: CalendarDays, label: 'Rodada'  },
  { to: '/feed',    icon: Newspaper,    label: 'Feed'    },
  { to: '/votacao', icon: Star,         label: 'Votar'   },
  { to: '/perfil',  icon: User,         label: 'Perfil'  },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#111827] border-t border-[#1F2937]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
        {navItems.map(({ to, icon: Icon, label }) => (
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
