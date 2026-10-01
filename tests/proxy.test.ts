import { afterEach, describe, expect, it } from 'vitest'

import { isAuthorized } from '../src/proxy'

const originalPassword = process.env.APP_PASSWORD
const originalUsername = process.env.APP_USERNAME

afterEach(() => {
  if (originalPassword === undefined) delete process.env.APP_PASSWORD
  else process.env.APP_PASSWORD = originalPassword
  if (originalUsername === undefined) delete process.env.APP_USERNAME
  else process.env.APP_USERNAME = originalUsername
})

describe('isAuthorized', () => {
  it('allows requests when password protection is not configured', () => {
    delete process.env.APP_PASSWORD
    expect(isAuthorized(null)).toBe(true)
  })

  it('requires the configured username and password', () => {
    process.env.APP_USERNAME = 'demo'
    process.env.APP_PASSWORD = 'correct horse battery staple'

    const valid = `Basic ${Buffer.from('demo:correct horse battery staple').toString('base64')}`
    const invalid = `Basic ${Buffer.from('demo:wrong').toString('base64')}`

    expect(isAuthorized(valid)).toBe(true)
    expect(isAuthorized(invalid)).toBe(false)
    expect(isAuthorized(null)).toBe(false)
  })
})
