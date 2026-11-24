import assert from 'node:assert/strict'
import test from 'node:test'
import { AppError, errorCodes, getErrorCode } from './errors.ts'
import { detectLanguage, messages } from './i18n.ts'
import { parseTotpInput } from './totp.ts'

test('language detection respects supported browser preferences and has a fallback', () => {
  assert.equal(detectLanguage(['vi-VN', 'en-US']), 'vi')
  assert.equal(detectLanguage(['fr-FR', 'en-GB', 'vi']), 'en')
  assert.equal(detectLanguage(['ja-JP']), 'vi')
  assert.equal(detectLanguage([]), 'vi')
})

test('every user-facing error has Vietnamese and English translations', () => {
  for (const code of errorCodes) {
    assert.ok(messages.vi.errors[code].length > 0, code)
    assert.ok(messages.en.errors[code].length > 0, code)
    assert.notEqual(messages.vi.errors[code], messages.en.errors[code], code)
  }
  assert.deepEqual(Object.keys(messages.vi).sort(), Object.keys(messages.en).sort())
})

test('existing errors can be retranslated without parsing or exposing input again', () => {
  let code
  try { parseTotpInput('INVALID01') } catch (cause) { code = getErrorCode(cause) }
  assert.equal(code, 'invalidSecret')
  assert.match(messages.en.errors[code!], /Invalid Base32/)
  assert.match(messages.vi.errors[code!], /Base32 không hợp lệ/)
  assert.equal(getErrorCode(new Error('private input must not be displayed')), 'unexpected')
  assert.equal(getErrorCode(new AppError('qrNotFound')), 'qrNotFound')
})
