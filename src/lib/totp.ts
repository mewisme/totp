import { TOTP } from 'totp-generator'
import { AppError } from './errors.ts'

export type Algorithm = 'SHA-1' | 'SHA-256' | 'SHA-512'
export type Account = {
  id: string
  issuer: string
  name: string
  secret: string
  algorithm: Algorithm
  digits: 6 | 8
  period: number
}
export type AccountInput = Omit<Account, 'id'>

export function normalizeSecret(value: string): string {
  const secret = value.toUpperCase().replace(/\s/g, '').replace(/=+$/, '')
  if (!secret || secret.length > 1024 || !/^[A-Z2-7]+$/.test(secret) || ![0, 2, 4, 5, 7].includes(secret.length % 8)) {
    throw new AppError('invalidSecret')
  }
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const remainder = (secret.length * 5) % 8
  if (remainder && (alphabet.indexOf(secret.at(-1)!) & ((1 << remainder) - 1)) !== 0) {
    throw new AppError('invalidSecretBits')
  }
  return secret
}

export function validateAccount(input: AccountInput): AccountInput {
  if (!input.name.trim()) throw new AppError('missingName')
  if (input.name.length > 200 || input.issuer.length > 100) throw new AppError('nameTooLong')
  if (!['SHA-1', 'SHA-256', 'SHA-512'].includes(input.algorithm)) throw new AppError('unsupportedAlgorithm')
  if (input.digits !== 6 && input.digits !== 8) throw new AppError('unsupportedDigits')
  if (!Number.isSafeInteger(input.period) || input.period < 1 || input.period > 300) throw new AppError('invalidPeriod')
  return { ...input, issuer: input.issuer.trim(), name: input.name.trim(), secret: normalizeSecret(input.secret) }
}

export function parseOtpAuth(value: string): AccountInput {
  let url: URL
  try { url = new URL(value.trim()) } catch { throw new AppError('invalidUri') }
  if (url.protocol !== 'otpauth:' || url.hostname !== 'totp') throw new AppError('unsupportedUri')
  let label: string
  try { label = decodeURIComponent(url.pathname.slice(1)) } catch { throw new AppError('invalidLabel') }
  const separator = label.indexOf(':')
  const prefix = separator >= 0 ? label.slice(0, separator).trim() : ''
  const issuer = url.searchParams.get('issuer')?.trim() || prefix
  if (prefix && issuer !== prefix) throw new AppError('issuerMismatch')
  const algorithm = url.searchParams.get('algorithm')?.toUpperCase() ?? 'SHA1'
  const algorithms: Record<string, Algorithm> = { SHA1: 'SHA-1', SHA256: 'SHA-256', SHA512: 'SHA-512' }
  return validateAccount({
    issuer,
    name: (separator >= 0 ? label.slice(separator + 1) : label).trim(),
    secret: url.searchParams.get('secret') ?? '',
    algorithm: algorithms[algorithm]!,
    digits: Number(url.searchParams.get('digits') ?? 6) as 6 | 8,
    period: Number(url.searchParams.get('period') ?? 30),
  })
}

export function parseTotpInput(value: string): AccountInput {
  const input = value.trim()
  if (/^otpauth:/i.test(input)) return parseOtpAuth(input)
  return validateAccount({ issuer: '', name: 'OTP', secret: input, algorithm: 'SHA-1', digits: 6, period: 30 })
}

export async function generateTimeWindow(account: AccountInput, now: number): Promise<string[]> {
  return Promise.all([-30000, 0, 30000].map(offset => generateTotp(account, now + offset)))
}

export type TotpCodeCache = Record<string, string>

export async function prepareTimeWindow(account: AccountInput, now: number): Promise<TotpCodeCache> {
  const counters = new Set([-30, 0, 30].flatMap(offset => {
    const counter = Math.floor((now / 1000 + offset) / account.period)
    return [counter, counter + 1]
  }))
  const entries = await Promise.all(Array.from(counters, async counter =>
    [String(counter), await generateTotp(account, counter * account.period * 1000)] as const,
  ))
  return Object.fromEntries(entries)
}

export function readTimeWindow(cache: TotpCodeCache, account: AccountInput, now: number): string[] | null {
  const codes = [-30, 0, 30].map(offset => cache[String(Math.floor((now / 1000 + offset) / account.period))])
  return codes.every((code): code is string => typeof code === 'string') ? codes : null
}

export async function generateTotp(account: AccountInput, now: number): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new AppError('cryptoUnavailable')
  const { otp } = await TOTP.generate(normalizeSecret(account.secret), {
    algorithm: account.algorithm,
    digits: account.digits,
    period: account.period,
    timestamp: now,
    explicitZeroPad: true,
  })
  return otp
}
