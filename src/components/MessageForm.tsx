import { type FormEvent, type KeyboardEvent, useState } from 'react'

import { useMessages } from 'shared/lib/useMessages'

export default function MessageForm() {
  const [content, setContent] = useState('')
  const { addMessage, isLoadingAnswer, stopResponse } = useMessages()

  const submit = async () => {
    const message = content.trim()
    if (!message || isLoadingAnswer) return
    setContent('')
    await addMessage(message)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void submit()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      void submit()
    }
  }

  return (
    <div className="composer-wrap">
      <form className="composer" onSubmit={handleSubmit}>
        <label htmlFor="message" className="sr-only">Сообщение</label>
        <textarea
          id="message"
          name="message"
          value={content}
          rows={1}
          maxLength={12_000}
          placeholder="Напишите сообщение…"
          aria-describedby="composer-hint"
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        {isLoadingAnswer ? (
          <button className="stop-button" type="button" onClick={stopResponse}>
            <span aria-hidden="true" />
            Остановить
          </button>
        ) : (
          <button className="send-button" type="submit" disabled={!content.trim()} aria-label="Отправить">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m5 12 7-7 7 7M12 5v14" />
            </svg>
          </button>
        )}
      </form>
      <p id="composer-hint">Enter — отправить · Shift + Enter — новая строка</p>
    </div>
  )
}
