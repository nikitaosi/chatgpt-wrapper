import Head from 'next/head'

import MessageForm from 'components/MessageForm'
import MessagesList from 'components/MessagesList'
import { MessagesProvider, useMessages } from 'shared/lib/useMessages'

function Chat() {
  const { clearMessages } = useMessages()

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">C</span>
          <div>
            <strong>Chat</strong>
            <span>OpenAI assistant</span>
          </div>
        </div>
        <button className="new-chat" type="button" onClick={clearMessages}>
          Новый чат
        </button>
      </header>

      <MessagesList />
      <MessageForm />
    </main>
  )
}

export default function IndexPage() {
  return (
    <>
      <Head>
        <title>Chat · OpenAI assistant</title>
        <meta name="description" content="Минималистичный интерфейс для общения с OpenAI" />
      </Head>
      <MessagesProvider>
        <Chat />
      </MessagesProvider>
    </>
  )
}
