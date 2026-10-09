import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useRef,
  useState
} from 'react'

import { streamMessage } from './sendMessage'
import type { ApiMessage, ChatMessage } from 'shared/types/chat'

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: 'Hello! How can I help today?'
}

interface MessagesContextValue {
  messages: ChatMessage[]
  addMessage: (content: string) => Promise<void>
  clearMessages: () => void
  stopResponse: () => void
  isLoadingAnswer: boolean
  error: string | null
}

const MessagesContext = createContext<MessagesContextValue | null>(null)
const createId = () => crypto.randomUUID()

export function MessagesProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  const stopResponse = useCallback(() => controllerRef.current?.abort(), [])

  const clearMessages = useCallback(() => {
    controllerRef.current?.abort()
    setMessages([WELCOME_MESSAGE])
    setError(null)
  }, [])

  const addMessage = useCallback(async (rawContent: string) => {
    const content = rawContent.trim()
    if (!content || isLoadingAnswer) return

    const userMessage: ChatMessage = { id: createId(), role: 'user', content }
    const assistantId = createId()
    const history = [...messages, userMessage]
    const apiMessages: ApiMessage[] = history
      .filter((message) => message.id !== 'welcome')
      .map(({ role, content: messageContent }) => ({ role, content: messageContent }))

    setMessages([...history, { id: assistantId, role: 'assistant', content: '' }])
    setIsLoadingAnswer(true)
    setError(null)

    const controller = new AbortController()
    controllerRef.current = controller

    try {
      await streamMessage(apiMessages, {
        signal: controller.signal,
        onChunk: (chunk) => {
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId
                ? { ...message, content: message.content + chunk }
                : message
            )
          )
        }
      })
    } catch (streamError) {
      if (streamError instanceof DOMException && streamError.name === 'AbortError') return
      setMessages((current) => current.filter((message) => message.id !== assistantId))
      setError(streamError instanceof Error ? streamError.message : 'Something went wrong.')
    } finally {
      controllerRef.current = null
      setIsLoadingAnswer(false)
    }
  }, [isLoadingAnswer, messages])

  return (
    <MessagesContext.Provider
      value={{ messages, addMessage, clearMessages, stopResponse, isLoadingAnswer, error }}
    >
      {children}
    </MessagesContext.Provider>
  )
}

export function useMessages() {
  const context = useContext(MessagesContext)
  if (!context) throw new Error('useMessages must be used inside MessagesProvider')
  return context
}
