import type { ApiMessage } from 'shared/types/chat'

type StreamOptions = {
  signal?: AbortSignal
  onChunk: (chunk: string) => void
}

export async function streamMessage(
  messages: ApiMessage[],
  { signal, onChunk }: StreamOptions
) {
  const response = await fetch('/api/createMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(payload?.error ?? 'Could not get a response.')
  }

  if (!response.body) throw new Error('Your browser does not support streamed responses.')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let completed = false

  const handleEvent = (frame: string) => {
    let eventName = 'message'
    const data: string[] = []

    for (const line of frame.split(/\r?\n/)) {
      if (line.startsWith('event:')) eventName = line.slice(6).trim()
      if (line.startsWith('data:')) data.push(line.slice(5).trimStart())
    }

    if (!data.length) return

    let payload: { text?: string; message?: string }
    try {
      payload = JSON.parse(data.join('\n')) as { text?: string; message?: string }
    } catch {
      throw new Error('The server sent an invalid response chunk.')
    }

    if (eventName === 'delta' && typeof payload.text === 'string') onChunk(payload.text)
    if (eventName === 'error') throw new Error(payload.message ?? 'Could not get a response.')
    if (eventName === 'done') completed = true
  }

  while (true) {
    const { done, value } = await reader.read()
    buffer += decoder.decode(value, { stream: !done })

    const frames = buffer.split(/\r?\n\r?\n/)
    buffer = frames.pop() ?? ''
    for (const frame of frames) handleEvent(frame)

    if (done) break
  }

  if (buffer.trim()) handleEvent(buffer)
  if (!completed) throw new Error('The response stream ended unexpectedly.')
}
