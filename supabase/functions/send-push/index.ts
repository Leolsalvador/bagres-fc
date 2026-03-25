// Supabase Edge Function — send-push
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const VAPID_PUBLIC_KEY = 'BKmvbEHOT6DQ-_BYQtGC8OSQb0QOCxlt1Qq3gOU4B0vvw3dCB7HBla1YlKQSn36VQLnaJOcJUKEAjMW5x6ZiDSw'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    // Inicialização dentro do handler para evitar crash no startup
    const privateKey = Deno.env.get('VAPID_PRIVATE_KEY')?.trim()
    if (!privateKey) throw new Error('VAPID_PRIVATE_KEY não configurada')

    webpush.setVapidDetails('mailto:admin@bagresfc.app', VAPID_PUBLIC_KEY, privateKey)

    const { title, body, userIds } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    let query = supabase.from('push_subscriptions').select('subscription')
    if (userIds?.length) query = query.in('user_id', userIds)

    const { data: rows, error } = await query
    if (error) throw error

    const payload = JSON.stringify({ title, body })
    const results = await Promise.allSettled(
      (rows ?? []).map(r => webpush.sendNotification(r.subscription, payload))
    )

    const sent   = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return new Response(JSON.stringify({ sent, failed }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('send-push error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
