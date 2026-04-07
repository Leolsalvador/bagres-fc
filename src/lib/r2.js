import { AwsClient } from 'aws4fetch'

const R2_ACCOUNT_ID = import.meta.env.VITE_R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = import.meta.env.VITE_R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = import.meta.env.VITE_R2_SECRET_ACCESS_KEY
const R2_BUCKET = import.meta.env.VITE_R2_BUCKET
export const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL

const r2 = new AwsClient({
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
  service: 's3',
  region: 'auto',
})

export async function uploadToR2(key, file) {
  const url = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}/${key}`
  const response = await r2.fetch(url, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`R2 upload falhou: ${response.status} ${text}`)
  }
  return `${R2_PUBLIC_URL}/${key}?t=${Date.now()}`
}
