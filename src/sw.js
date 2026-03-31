import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

// Precache de todos os assets (injetado pelo vite-plugin-pwa)
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Serve index.html para todas as rotas de navegação (SPA)
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')))

// Permite que o botão "Atualizar" ative o novo SW imediatamente
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

// ── Alarme do cronômetro ──────────────────────────────────────
let _alarmTimeout = null

self.addEventListener('message', (event) => {
  const { type, endTimestamp, teamA, teamB } = event.data ?? {}

  if (type === 'TIMER_ALARM_SET') {
    if (_alarmTimeout) clearTimeout(_alarmTimeout)
    const delay = Math.max(0, endTimestamp - Date.now())
    // Captura no closure antes do event ser GC'd
    const tA = teamA, tB = teamB

    // event.waitUntil mantém o SW vivo até a Promise resolver
    event.waitUntil(
      new Promise((resolve) => {
        _alarmTimeout = setTimeout(() => {
          _alarmTimeout = null
          self.registration.showNotification('⏱ Fim de jogo!', {
            body:             `${tA} × ${tB} — Tempo esgotado!`,
            icon:             '/icons/icon-192.png',
            badge:            '/icons/icon-192.png',
            vibrate:          [400, 100, 400, 100, 800],
            tag:              'timer-alarm',
            requireInteraction: true,
          }).then(resolve).catch(resolve)
        }, delay)
      })
    )
  }

  if (type === 'TIMER_ALARM_CANCEL') {
    if (_alarmTimeout) { clearTimeout(_alarmTimeout); _alarmTimeout = null }
  }
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
