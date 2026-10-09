import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function isAuthorized(authorization: string | null) {
  const expectedPassword = process.env.APP_PASSWORD
  if (!expectedPassword) return true
  if (!authorization?.startsWith('Basic ')) return false

  try {
    const encodedCredentials = authorization.slice('Basic '.length)
    const binaryCredentials = atob(encodedCredentials)
    const bytes = Uint8Array.from(binaryCredentials, (character) => character.charCodeAt(0))
    const credentials = new TextDecoder().decode(bytes)
    const separatorIndex = credentials.indexOf(':')
    if (separatorIndex < 0) return false

    const username = credentials.slice(0, separatorIndex)
    const password = credentials.slice(separatorIndex + 1)
    return username === (process.env.APP_USERNAME ?? 'preview') && password === expectedPassword
  } catch {
    return false
  }
}

export function proxy(request: NextRequest) {
  if (isAuthorized(request.headers.get('authorization'))) return NextResponse.next()

  return new NextResponse('To access the demo, enter your username and password.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Chat demo", charset="UTF-8"',
      'Cache-Control': 'no-store'
    }
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
