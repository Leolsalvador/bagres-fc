import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const VAPID_PUBLIC_KEY = 'BJXT7wnqdAJaw2N_lj9fvkk_ADF4XHYw27VYk5AFPAST7jueQVnVals7LIA-VsJ5ctV_gpUBN1_DWy-T5Z40AqA'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0))
}

export function usePushNotifications(userId) {
  const [permission, setPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'default')

  useEffect(() => {
    if (!userId || permission !== 'granted') return
    subscribe(userId)
  }, [userId, permission])

  async function requestPermission() {
    if (typeof Notification === 'undefined') return
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === 'granted') await subscribe(userId)
  }

  async function subscribe(uid) {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    try {
      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      const sub = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      await supabase.from('push_subscriptions').upsert({
        user_id: uid,
        subscription: sub.toJSON(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
    } catch (err) {
      console.error('Push subscribe error:', err)
    }
  }

  return { permission, requestPermission }
}
