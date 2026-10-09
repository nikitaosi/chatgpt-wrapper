import { useEffect, useRef } from 'react'

import { useMessages } from 'shared/lib/useMessages'

export default function MessagesList() {
  const { messages, isLoadingAnswer, error } = useMessages()
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  return (
    <section className="conversation" aria-label="Conversation history" aria-live="polite">
      <div className="message-list">
        {messages.map((message) => {
          const isUser = message.role === 'user'
          return (
            <article className={`message-row ${isUser ? 'message-row-user' : ''}`} key={message.id}>
              {!isUser && <span className="avatar assistant-avatar" aria-hidden="true">C</span>}
              <div className={`message ${isUser ? 'message-user' : 'message-assistant'}`}>
                {message.content || <span className="typing-cursor" aria-label="Generating response" />}
              </div>
              {isUser && <span className="avatar user-avatar" aria-hidden="true">You</span>}
            </article>
          )
        })}
        {error && <p className="error-message" role="alert">{error}</p>}
        {isLoadingAnswer && <span className="stream-status sr-only">Response is being generated</span>}
        <div ref={endRef} />
      </div>
    </section>
  )
}
