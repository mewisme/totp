import assert from 'node:assert/strict'
import test from 'node:test'
import { getProviderDomain, getProviderLogoUrl } from './provider.ts'
import { generateTotp, generateTimeWindow, prepareTimeWindow, readTimeWindow, normalizeSecret, parseOtpAuth, parseTotpInput, validateAccount, type AccountInput, type Algorithm } from './totp.ts'

function base32(value: string) {
  const bits = [...new TextEncoder().encode(value)].map(byte => byte.toString(2).padStart(8, '0')).join('')
  return bits.match(/.{1,5}/g)!.map(part => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[parseInt(part.padEnd(5, '0'), 2)]).join('')
}

// RFC 6238 Appendix B: all timestamps and HMAC algorithms, including 64-bit counters.
const vectors: [number, string, string, string][] = [
  [59, '94287082', '46119246', '90693936'],
  [1111111109, '07081804', '68084774', '25091201'],
  [1111111111, '14050471', '67062674', '99943326'],
  [1234567890, '89005924', '91819424', '93441116'],
  [2000000000, '69279037', '90698825', '38618901'],
  [20000000000, '65353130', '77737706', '47863826'],
]
for (const [time, ...expected] of vectors) {
  const algorithms: Algorithm[] = ['SHA-1', 'SHA-256', 'SHA-512']
  for (const [index, algorithm] of algorithms.entries()) {
    test(`RFC 6238 ${algorithm} at ${time}`, async () => {
      const secret = '1234567890'.repeat(7).slice(0, [20, 32, 64][index])
      const account: AccountInput = { name: 'RFC', issuer: '', secret: base32(secret), algorithm, digits: 8, period: 30 }
      assert.equal(await generateTotp(account, time * 1000), expected[index])
    })
  }
}
test('Base32 normalizes spaces, case and padding and rejects malformed input', () => {
  assert.equal(normalizeSecret(' mz xw6=== '), 'MZXW6')
  for (const bad of ['', 'ABC01', 'A', 'MZ', 'MY=ABC']) assert.throws(() => normalizeSecret(bad))
})
test('URI reads encoded labels and custom TOTP parameters', () => {
  assert.deepEqual(parseOtpAuth('otpauth://totp/ACME%20Co%3Aalice%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=ACME%20Co&algorithm=SHA256&digits=8&period=60'), {
    issuer: 'ACME Co', name: 'alice@example.com', secret: 'JBSWY3DPEHPK3PXP', algorithm: 'SHA-256', digits: 8, period: 60,
  })
})
test('URI defaults and invalid parameter handling', () => {
  const uri = 'otpauth://totp/alice?secret=JBSWY3DPEHPK3PXP'
  assert.equal(parseOtpAuth(uri).period, 30)
  assert.equal(parseOtpAuth(uri).digits, 6)
  for (const bad of [uri.replace('totp', 'hotp'), uri + '&digits=7', uri + '&period=0', uri + '&period=1.5', uri + '&algorithm=MD5', 'not a url', 'otpauth://totp/X:alice?secret=MY&issuer=Y']) assert.throws(() => parseOtpAuth(bad))
})
test('six digit codes are padded and rotate on the period boundary', async () => {
  const account = validateAccount({ issuer: '', name: 'test', secret: base32('12345678901234567890'), algorithm: 'SHA-1', digits: 6, period: 30 })
  assert.equal(await generateTotp(account, 59999), '287082')
  assert.equal(await generateTotp(account, 60000), '359152')
  assert.equal(await generateTotp(account, 1111111109000), '081804')
})

test('one input accepts either a secret or an otpauth URI', () => {
  const secret = parseTotpInput(' jbsw y3dp ehpk3pxp ')
  assert.equal(secret.secret, 'JBSWY3DPEHPK3PXP')
  assert.equal(secret.period, 30)
  assert.equal(secret.digits, 6)
  assert.equal(parseTotpInput(' otpauth://totp/Demo:alice?secret=JBSWY3DPEHPK3PXP ').name, 'alice')
  assert.throws(() => parseTotpInput('https://example.com'))
})

test('three codes represent exactly -30, now and +30 seconds and roll together', async () => {
  const account = parseTotpInput(base32('12345678901234567890'))
  assert.deepEqual(await generateTimeWindow(account, 59999), ['755224', '287082', '359152'])
  assert.deepEqual(await generateTimeWindow(account, 60000), ['287082', '359152', '969429'])
})

test('URI periods are honored while the three timestamps stay 30 seconds apart', async () => {
  const account = parseTotpInput('otpauth://totp/alice?secret=JBSWY3DPEHPK3PXP&period=60&digits=8')
  const codes = await generateTimeWindow(account, 90000)
  assert.deepEqual(codes, await Promise.all([60000, 90000, 120000].map(time => generateTotp(account, time))))
  assert.equal(codes[0], codes[1])
  assert.notEqual(codes[1], codes[2])
})

test('provider metadata supports issuer, label prefix and custom names without guessing from email', () => {
  const queryIssuer = parseTotpInput('otpauth://totp/alice%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=My%20Custom%20Service')
  assert.equal(queryIssuer.issuer, 'My Custom Service')
  assert.equal(queryIssuer.name, 'alice@example.com')
  const prefixIssuer = parseTotpInput('otpauth://totp/GitHub%3A%20alice?secret=JBSWY3DPEHPK3PXP')
  assert.equal(prefixIssuer.issuer, 'GitHub')
  assert.equal(prefixIssuer.name, 'alice')
  assert.equal(parseTotpInput('otpauth://totp/alice%40gmail.com?secret=JBSWY3DPEHPK3PXP').issuer, '')
  assert.equal(parseTotpInput('JBSWY3DPEHPK3PXP').issuer, '')
})

test('provider logos resolve known names and explicit domains without guessing or leaking URI data', () => {
  assert.equal(getProviderDomain(' GitHub '), 'github.com')
  assert.equal(getProviderDomain('Cloudflare'), 'cloudflare.com')
  assert.equal(getProviderDomain('login.example.org'), 'login.example.org')
  assert.equal(getProviderLogoUrl('https://login.example.org/path?secret=PRIVATE#alice'), 'https://www.google.com/s2/favicons?domain=login.example.org&sz=64')
  for (const issuer of ['', 'My Custom Service', 'constructor', '__proto__', 'alice@gmail.com', 'localhost', '127.0.0.1', 'service.local', 'https://user:password@example.org', 'otpauth://totp/alice?secret=PRIVATE']) {
    assert.equal(getProviderLogoUrl(issuer), null)
  }
})

test('prefetched codes are ready at rollover without a missing window', async () => {
  const account = parseTotpInput(base32('12345678901234567890'))
  const cache = await prepareTimeWindow(account, 59999)
  assert.deepEqual(readTimeWindow(cache, account, 59999), ['755224', '287082', '359152'])
  assert.deepEqual(readTimeWindow(cache, account, 60000), ['287082', '359152', '969429'])
})

test('prefetch handles custom periods where the three cards cross boundaries at different times', async () => {
  const account = parseTotpInput('otpauth://totp/alice?secret=JBSWY3DPEHPK3PXP&period=45')
  const cache = await prepareTimeWindow(account, 89999)
  for (const time of [89999, 90000, 104999]) {
    assert.deepEqual(readTimeWindow(cache, account, time), await generateTimeWindow(account, time))
  }
  assert.equal(readTimeWindow({}, account, 90000), null)
})
