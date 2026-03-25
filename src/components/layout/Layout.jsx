import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import { useAuth } from '@/hooks/useAuth'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export default function Layout() {
  const { profile } = useAuth()
  const { permission, requestPermission } = usePushNotifications(profile?.id)

  // Pede permissão automaticamente após login (só uma vez)
  useEffect(() => {
    if (profile?.id && permission === 'default') {
      requestPermission()
    }
  }, [profile?.id])

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
