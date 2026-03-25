// Supabase Edge Function — send-push
// Envia Web Push para todos os usuários (ou lista específica)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_PUBLIC_KEY  = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_SUBJECT     = 'mailto:admin@bagresfc.app'

// Converte base64url para Uint8Array
function base64urlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - base64.length % 4)
  return Uint8Array.from(atob(base64 + pad), c => c.charCodeAt(0))
}

async function buildVapidAuth(audience: string): Promise<string> {
  const header  = { typ: 'JWT', alg: 'ES256' }
  const payload = { aud: audience, exp: Math.floor(Date.now() / 1000) + 86400, sub: VAPID_SUBJECT }
  const encode  = (obj: object) => btoa(JSON.stringify(obj)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
  const unsigned = `${encode(header)}.${encode(payload)}`

  const keyData = base64urlToUint8Array(VAPID_PRIVATE_KEY)
  const key = await crypto.subtle.importKey(
    'pkcs8', keyData,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign']
  )
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(unsigned)
  )
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
  return `vapid t=${unsigned}.${sigB64},k=${VAPID_PUBLIC_KEY}`
}

async function sendPush(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }, payload: string) {
  const url      = new URL(subscription.endpoint)
  const audience = `${url.protocol}//${url.host}`
  const auth     = await buildVapidAuth(audience)

  // Criptografia ECDH para o payload (simplificado — envia sem criptografia como text/plain)
  // Para produção usar web-push library via npm em Deno
  const res = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400',
    },
    body: await encryptPayload(subscription.keys, payload),
  })
  return res.status
}

// Criptografia ECDH + AES-GCM conforme RFC 8291
async function encryptPayload(keys: { p256dh: string; auth: string }, plaintext: string) {
  const p256dh   = base64urlToUint8Array(keys.p256dh)
  const authKey  = base64urlToUint8Array(keys.auth)
  const userKey  = await crypto.subtle.importKey('raw', p256dh, { name: 'ECDH', namedCurve: 'P-256' }, false, [])

  const serverKeyPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey', 'deriveBits'])
  const serverPubRaw  = new Uint8Array(await crypto.subtle.exportKey('raw', serverKeyPair.publicKey))

  const sharedBits = await crypto.subtle.deriveBits({ name: 'ECDH', public: userKey }, serverKeyPair.privateKey, 256)
  const salt = crypto.getRandomValues(new Uint8Array(16))

  const prk = await crypto.subtle.importKey('raw', await hkdf(authKey, new Uint8Array(sharedBits), 'Content-Encoding: auth\0', 32), 'HKDF', false, ['deriveKey', 'deriveBits'])
  const context = concat(new TextEncoder().encode('Content-Encoding: aes128gcm\0'), new Uint8Array([0, 65]), serverPubRaw, new Uint8Array([0, 65]), p256dh)
  const cek     = await hkdf(salt, new Uint8Array(await crypto.subtle.exportKey('raw', prk as CryptoKey)), concat(context, new Uint8Array([1])), 16)
  const nonce   = await hkdf(salt, new Uint8Array(await crypto.subtle.exportKey('raw', prk as CryptoKey)), concat(new TextEncoder().encode('Content-Encoding: nonce\0'), context, new Uint8Array([1])), 12)

  const aesKey  = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt'])
  const data    = concat(new TextEncoder().encode(plaintext), new Uint8Array([2])) // padding delimiter
  const cipher  = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, data))

  // RFC 8291 header: salt(16) + rs(4) + idlen(1) + keyid(65)
  const rs = new Uint8Array(4); new DataView(rs.buffer).setUint32(0, 4096)
  return concat(salt, rs, new Uint8Array([65]), serverPubRaw, cipher)
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array | string, len: number): Promise<Uint8Array> {
  const infoBytes = typeof info === 'string' ? new TextEncoder().encode(info) : info
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info: infoBytes }, key, len * 8))
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0)
  const out = new Uint8Array(total)
  let off = 0
  for (const a of arrays) { out.set(a, off); off += a.length }
  return out
}

// ── Handler principal ────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } })
  }

  const { title, body, userIds } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  let query = supabase.from('push_subscriptions').select('subscription')
  if (userIds?.length) query = query.in('user_id', userIds)

  const { data: rows, error } = await query
  if (error) return new Response(JSON.stringify({ error }), { status: 500 })

  const payload = JSON.stringify({ title, body })
  const results = await Promise.allSettled(
    (rows ?? []).map(r => sendPush(r.subscription, payload))
  )

  const sent   = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  return new Response(JSON.stringify({ sent, failed }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  })
})
