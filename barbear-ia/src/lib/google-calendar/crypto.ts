import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

function key() {
  const raw = process.env.GOOGLE_CALENDAR_TOKEN_KEY ?? ''
  if (!/^[a-f0-9]{64}$/i.test(raw)) throw new Error('Google Agenda não configurado.')
  return Buffer.from(raw, 'hex')
}

export function encrypt(value: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url')
}

export function decrypt(value: string) {
  const raw = Buffer.from(value, 'base64url')
  const decipher = createDecipheriv('aes-256-gcm', key(), raw.subarray(0, 12))
  decipher.setAuthTag(raw.subarray(12, 28))
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8')
}
