import { afterEach, describe, expect, it, vi } from 'vitest'

import { streamMessage } from './sendMessage'

afterEach(() => vi.unstubAllGlobals())

describe('streamMessage', () => {
  it('delivers every streamed text chunk in order, including split events', async () => {
    const encoder = new TextEncoder()
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('event: delta\ndata: {"text":"Hello"'))
        controller.enqueue(encoder.encode('}\n\nevent: delta\ndata: {"text":", world"}\n\nevent: done\ndata: {}\n\n'))
        controller.close()
      }
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body)))
    const chunks: string[] = []

    await streamMessage([{ role: 'user', content: 'Hello' }], {
      onChunk: (chunk) => chunks.push(chunk)
    })

    expect(chunks.join('')).toBe('Hello, world')
  })

  it('surfaces a useful API error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      Response.json({ error: 'Rate limit exceeded' }, { status: 429 })
    ))

    await expect(
      streamMessage([{ role: 'user', content: 'Hello' }], { onChunk: vi.fn() })
    ).rejects.toThrow('Rate limit exceeded')
  })

  it('surfaces errors sent after the stream starts', async () => {
    const body = new Response(
      'event: error\ndata: {"message":"The API balance is depleted"}\n\n'
    )

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(body))

    await expect(
      streamMessage([{ role: 'user', content: 'Hello' }], { onChunk: vi.fn() })
    ).rejects.toThrow('The API balance is depleted')
  })
})
