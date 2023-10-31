import ChatCompletionRequestMessage from 'openai'
// import {Toast} from "@adobe/react-spectrum"
import { ReactNode, createContext, useContext, useEffect, useState } from 'react'
import { sendMessage } from './sendMessage'

interface ContextProps {
  messages: ChatCompletionRequestMessage[]
  addMessage: (content: string) => Promise<void>
  isLoadingAnswer: boolean
}

const ChatsContext = createContext<Partial<ContextProps>>({})

export function MessagesProvider({ children }: { children: ReactNode }) {
  // const { addToast } = useToast()
  const [messages, setMessages] = useState<ChatCompletionRequestMessage[]>([])
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false)

  useEffect(() => {
    const initializeChat = () => {
      // #TODO remove any
      const systemMessage: any = {
        role: 'system',
        content: 'You are ChatGPT, a large language model trained by OpenAI.'
      }
      const welcomeMessage: any = {
        role: 'assistant',
        content: 'Здравствуйте! Как я могу вам помочь?'
      }
      setMessages([systemMessage, welcomeMessage])
    }

    // When no messages are present, we initialize the chat the system message and the welcome message
    // We hide the system message from the user in the UI
    if (!messages?.length) {
      initializeChat()
    }
  }, [messages?.length, setMessages])

  const addMessage = async (content: string) => {
    setIsLoadingAnswer(true)
    try {
      const newMessage: any = {
        role: 'user',
        content
      }
      const newMessages = [...messages, newMessage]

      // Add the user message to the state, so we can see it immediately
      setMessages(newMessages)

      const { data } = await sendMessage(newMessages)
      const reply = data.choices[0].message

      // Add the assistant message to the state
      setMessages([...newMessages, reply])
    } catch (error) {
      // Show error when something goes wrong
      console.log(error)
      // addToast({ title: 'An error occurred', type: 'error' })
    } finally {
      setIsLoadingAnswer(false)
    }
  }

  return (
    <ChatsContext.Provider value={{ messages, addMessage, isLoadingAnswer }}>
      {children}
    </ChatsContext.Provider>
  )
}

export const useMessages = () => {
  return useContext(ChatsContext) as ContextProps
}
