import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

import type { ApiMessage } from 'shared/types/chat'

const MAX_MESSAGES = 100
const MAX_CONTENT_LENGTH = 12_000
export const MOCK_REPLY =
  'Sometimes clouds drift into a quiet queue. The wind counts them, loses track, and starts over. Nearby, a cup of tea slowly cools, in no hurry at all.'
const MOCK_CHUNK_DELAYS_MS = [80, 140, 105, 190, 95, 155] as const

export function shouldUseMockMode(
  mockSetting = process.env.MOCK_OPENAI,
  apiKey = process.env.OPENAI_API_KEY
) {
  return mockSetting === 'true' || !apiKey
}

export function getOpenAIErrorDetails(error: unknown) {
  const candidate = error as {
    status?: unknown
    code?: unknown
    error?: { code?: unknown }
  } | null
  const status = typeof candidate?.status === 'number' ? candidate.status : undefined
  const code = candidate?.code ?? candidate?.error?.code

  if (code === 'credit_balance_exhausted') {
    return {
      status: 402,
      message: 'Your OpenAI API balance is depleted. Add funds to your account and try again.'
    }
  }
  if (status === 401) {
    return { status: 502, message: 'OpenAI rejected the API key. Check OPENAI_API_KEY.' }
  }
  if (status === 429 || code === 'insufficient_quota') {
    return {
      status: 429,
      message: 'OpenAI rate-limited the request. Check your API account balance and limits.'
    }
  }

  return { status: 502, message: 'OpenAI is temporarily unavailable. Please try again.' }
}

function writeEvent(res: NextApiResponse, event: string, data: unknown) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

export function getMockChunks(text = MOCK_REPLY) {
  const words = text.match(/\S+\s*/gu) ?? []
  const chunkSizes = [1, 2, 1, 3]
  const chunks: string[] = []
  let offset = 0
  let sizeIndex = 0

  while (offset < words.length) {
    const size = chunkSizes[sizeIndex % chunkSizes.length]
    chunks.push(words.slice(offset, offset + size).join(''))
    offset += size
    sizeIndex += 1
  }

  return chunks
}

export function getMockChunkDelay(index: number) {
  return MOCK_CHUNK_DELAYS_MS[index % MOCK_CHUNK_DELAYS_MS.length]
}

function startStream(res: NextApiResponse) {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()
}

async function streamMockReply(res: NextApiResponse) {
  startStream(res)

  for (const [index, text] of getMockChunks().entries()) {
    if (res.destroyed) return
    writeEvent(res, 'delta', { text })
    await new Promise((resolve) => setTimeout(resolve, getMockChunkDelay(index)))
  }

  if (res.destroyed) return
  writeEvent(res, 'done', {})
  res.end()
}

export function parseMessages(value: unknown): ApiMessage[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_MESSAGES) return null

  const messages = value.filter((message): message is ApiMessage => {
    if (!message || typeof message !== 'object') return false
    const candidate = message as Partial<ApiMessage>
    return (
      (candidate.role === 'user' || candidate.role === 'assistant') &&
      typeof candidate.content === 'string' &&
      candidate.content.trim().length > 0 &&
      candidate.content.length <= MAX_CONTENT_LENGTH
    )
  })

  return messages.length === value.length ? messages : null
}

export default async function createMessage(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not supported' })
  }

  const useMock = shouldUseMockMode()

  const messages = parseMessages(req.body?.messages)
  if (!messages) return res.status(400).json({ error: 'Invalid message history' })

  if (useMock) return streamMockReply(res)

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const stream = await openai.responses.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
      instructions: 'You are a helpful assistant. Always reply in English.',
      input: messages,
      stream: true,
      store: false
    })

    startStream(res)

    for await (const event of stream) {
      if (event.type === 'response.output_text.delta') {
        writeEvent(res, 'delta', { text: event.delta })
      } else if (event.type === 'error') {
        writeEvent(res, 'error', { message: event.message })
        res.end()
        return
      }
    }

    writeEvent(res, 'done', {})
    res.end()
  } catch (error) {
    const details = getOpenAIErrorDetails(error)
    console.error('OpenAI streaming request failed', {
      status: (error as { status?: number })?.status,
      code: (error as { code?: string })?.code
    })
    if (!res.headersSent) return res.status(details.status).json({ error: details.message })
    writeEvent(res, 'error', { message: details.message })
    res.end()
  }
}
