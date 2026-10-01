export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
}

export type ApiMessage = Pick<ChatMessage, 'role' | 'content'>
