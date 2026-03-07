import { describe, it, expect } from 'vitest'
import { sanitizeMessage, sanitizeName } from '../../../app/utils/sanitize'

describe('sanitizeMessage', () => {
  it('returns plain text unchanged', () => {
    expect(sanitizeMessage('Hello world')).toBe('Hello world')
  })

  it('strips script tags (XSS)', () => {
    const input = '<script>alert("xss")</script>Hello'
    expect(sanitizeMessage(input)).not.toContain('<script>')
    expect(sanitizeMessage(input)).toContain('Hello')
  })

  it('strips img onerror (XSS)', () => {
    const input = '<img src=x onerror=alert(1)>text'
    expect(sanitizeMessage(input)).not.toContain('<img')
    expect(sanitizeMessage(input)).not.toContain('onerror')
  })

  it('strips all HTML tags', () => {
    const input = '<b>bold</b> <i>italic</i>'
    expect(sanitizeMessage(input)).toBe('bold italic')
  })

  it('preserves emojis and unicode', () => {
    expect(sanitizeMessage('Hello 👋 world')).toBe('Hello 👋 world')
  })

  it('handles empty string', () => {
    expect(sanitizeMessage('')).toBe('')
  })
})

describe('sanitizeName', () => {
  it('trims whitespace', () => {
    expect(sanitizeName('  John  ')).toBe('John')
  })

  it('truncates to 100 chars', () => {
    const long = 'a'.repeat(200)
    expect(sanitizeName(long).length).toBeLessThanOrEqual(100)
  })

  it('strips HTML from names', () => {
    expect(sanitizeName('<script>alert(1)</script>John')).not.toContain('<script>')
  })
})
