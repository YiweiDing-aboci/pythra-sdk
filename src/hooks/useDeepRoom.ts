import { useCallback, useState } from "react";
import { DeepMessage, DeepSetMessage } from "../types";
import { createConversation } from "../api/conversation";
import { sendStreamRequest } from "../api/deepChatStream";
import { useDeepHistory } from "./useDeepHistory";

export function useDeepRoom() {
  const [conversationId, setConversationId] = useState<string | null>()
  const {messages, setMessages, getHistory} = useDeepHistory()

  const getConversationId = useCallback(async(query: string) => {
    const res = await createConversation(query)
    setConversationId(res.conversationId)
    return res.conversationId
  }, [])

  const sendMessage = useCallback(async(query: string) => {
    const newUserMessage: DeepMessage = {
      id: Date.now() + 'user',
      type: 'human',
      content: query
    }
    const newBotMessage: DeepMessage = {
      id: Date.now() + 'bot',
      type: 'bot',
      content: '',
      isCreating: true,
      isThinking: true,
      head: {
        title: 'Master Orchestrator tool_result',
        description: 'Thinking · ~8 min',
      }
    }
    setMessages(pre => ([...pre, newUserMessage, newBotMessage]))
    let currentId = conversationId
    if (!currentId) {
      currentId = await getConversationId(query)
    }
    sendStreamRequest({
      conversationId: currentId as '',
      query,
      setMessages
    })
  }, [conversationId, getConversationId, setMessages])

  return {
    messages,
    getHistory,
    sendMessage,
    setConversationId
  }
}