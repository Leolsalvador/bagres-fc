import { Outlet } from 'react-router-dom'
import { Bell, X, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import BottomNav from './BottomNav'
import { useAuth } from '@/hooks/useAuth'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export default function Layout() {
  const { profile } = useAuth()
  const { permission, requestPermission } = usePushNotifications(profile?.id)
  const [dismissedNotif, setDismissedNotif] = useState(false)

  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()
  const showNotifBanner = profile?.id && permission === 'default' && !dismissedNotif

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Banner: nova versão disponível */}
      {needRefresh && (
        <div className="flex items-center gap-3 bg-secondary/10 border-b border-secondary/20 px-4 py-2.5">
          <RefreshCw size={16} className="text-secondary shrink-0" />
          <p className="text-text-main text-xs flex-1">Nova versão disponível.</p>
          <button
            onClick={() => updateServiceWorker(true)}
            className="text-xs font-bold text-secondary shrink-0 active:opacity-70"
          >
            Atualizar
          </button>
        </div>
      )}

      {/* Banner: ativar notificações */}
      {showNotifBanner && (
        <div className="flex items-center gap-3 bg-primary/10 border-b border-primary/20 px-4 py-2.5">
          <Bell size={16} className="text-primary shrink-0" />
          <p className="text-text-main text-xs flex-1">Ative as notificações para saber quando a lista abrir.</p>
          <button
            onClick={requestPermission}
            className="text-xs font-bold text-primary shrink-0 active:opacity-70"
          >
            Ativar
          </button>
          <button onClick={() => setDismissedNotif(true)} className="text-text-muted active:opacity-70">
            <X size={14} />
          </button>
        </div>
      )}

      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
