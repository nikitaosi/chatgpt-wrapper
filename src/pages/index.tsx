import Head from 'next/head'
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next'

import MessageForm from 'components/MessageForm'
import MessagesList from 'components/MessagesList'
import { MessagesProvider, useMessages } from 'shared/lib/useMessages'
import { shouldUseMockMode } from 'shared/lib/demoMode'

export const getServerSideProps = (async () => {
  return { props: { isDemoMode: shouldUseMockMode() } }
}) satisfies GetServerSideProps<{ isDemoMode: boolean }>

function Chat({ isDemoMode }: { isDemoMode: boolean }) {
  const { clearMessages } = useMessages()

  return (
    <main className="app-shell">
      <div>
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">C</span>
            <div>
              <strong>Chat</strong>
              <span>OpenAI assistant</span>
            </div>
          </div>
          <button className="new-chat" type="button" onClick={clearMessages}>
            New chat
          </button>
        </header>
        {isDemoMode && (
          <aside className="demo-notice" aria-label="Demo mode">
            <strong>Demo mode</strong>
            <span>Try the chat interface. Replies are prewritten.</span>
          </aside>
        )}
      </div>

      <MessagesList />
      <MessageForm />
    </main>
  )
}

export default function IndexPage({ isDemoMode }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <>
      <Head>
        <title>Chat · OpenAI assistant</title>
        <meta name="description" content="A minimal chat interface for OpenAI" />
      </Head>
      <MessagesProvider>
        <Chat isDemoMode={isDemoMode} />
      </MessagesProvider>
    </>
  )
}
