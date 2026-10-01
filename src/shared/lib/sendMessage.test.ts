import { afterEach, describe, expect, it, vi } from 'vitest'

import { streamMessage } from './sendMessage'

afterEach(() => vi.unstubAllGlobals())

describe('streamMessage', () => {
  it('delivers every streamed text chunk in order, including split events', async () => {
    const encoder = new TextEncoder()
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('event: delta\ndata: {"text":"Привет"'))
        controller.enqueue(encoder.encode('}\n\nevent: delta\ndata: {"text":", мир"}\n\nevent: done\ndata: {}\n\n'))
        controller.close()
      }
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body)))
    const chunks: string[] = []

    await streamMessage([{ role: 'user', content: 'Привет' }], {
      onChunk: (chunk) => chunks.push(chunk)
    })

    expect(chunks.join('')).toBe('Привет, мир')
  })

  it('surfaces a useful API error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      Response.json({ error: 'Лимит исчерпан' }, { status: 429 })
    ))

    await expect(
      streamMessage([{ role: 'user', content: 'Привет' }], { onChunk: vi.fn() })
    ).rejects.toThrow('Лимит исчерпан')
  })

  it('surfaces errors sent after the stream starts', async () => {
    const body = new Response(
      'event: error\ndata: {"message":"Закончился баланс"}\n\n'
    )

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(body))

    await expect(
      streamMessage([{ role: 'user', content: 'Привет' }], { onChunk: vi.fn() })
    ).rejects.toThrow('Закончился баланс')
  })
})
