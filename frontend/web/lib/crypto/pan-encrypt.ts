/**
 * AES-256-GCM encryption for PAN numbers using Web Crypto API.
 * The encryption key should be stored in Supabase Vault, never in code.
 */

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12 // 96 bits recommended for GCM

/**
 * Import the encryption key from base64-encoded env var
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyBase64 = process.env.PAN_ENCRYPTION_KEY!
  const keyBuffer = Buffer.from(keyBase64, 'base64')

  return crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt a PAN number using AES-256-GCM
 * Returns: base64(iv:ciphertext:tag)
 */
export async function encryptPAN(pan: string): Promise<string> {
  const key = await getEncryptionKey()
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const encoded = new TextEncoder().encode(pan)

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded
  )

  // Combine IV + ciphertext (GCM appends auth tag automatically)
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.length)

  return Buffer.from(combined).toString('base64')
}

/**
 * Decrypt a PAN number
 */
export async function decryptPAN(encrypted: string): Promise<string> {
  const key = await getEncryptionKey()
  const combined = new Uint8Array(Buffer.from(encrypted, 'base64'))

  const iv = combined.slice(0, IV_LENGTH)
  const ciphertext = combined.slice(IV_LENGTH)

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  )

  return new TextDecoder().decode(decrypted)
}

/**
 * Extract last 4 characters of PAN for display
 */
export function getPANLast4(pan: string): string {
  return pan.slice(-4)
}

/**
 * Validate PAN format: ABCDE1234F
 * 5 uppercase letters, 4 digits, 1 uppercase letter
 */
export function isValidPAN(pan: string): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)
}
