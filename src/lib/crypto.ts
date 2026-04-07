import crypto from 'crypto'

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex')
}

export function hashPassword(password: string, salt: string): string {
  return crypto.createHash('sha256').update(password + salt).digest('hex')
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  return hashPassword(password, salt) === hash
}

export function generateLicenseKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const segments: string[] = []
  for (let s = 0; s < 4; s++) {
    let seg = ''
    for (let i = 0; i < 4; i++) {
      seg += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    segments.push(seg)
  }
  return segments.join('-')
}
