import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

// Precache de todos os assets (injetado pelo vite-plugin-pwa)
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Permite que o botão "Atualizar" ative o novo SW imediatamente
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

// ── Push notifications ────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const title = data.title ?? 'Bagres FC'
  const body  = data.body  ?? ''

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:  '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
    })
  )
})

// Abre o app ao clicar na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((list) => {
      const existing = list.find(c => c.url.includes(self.location.origin) && 'focus' in c)
      if (existing) return existing.focus()
      return clients.openWindow('/')
    })
  )
})
