import { useState, useCallback } from "react"
import { createConversation } from "../api/conversation"

export function useDeepHistory() {
  const [messages, setMessages] = useState<string[]>([])

  const addMessage = useCallback(async(msg: string) => {
    const res = await createConversation(msg)
    console.log('🚀出来吧神龙\n\n\n\n',res,'\n\n\n\n🎈🎈🎈🎈🎈🎈🎈🎈🎈')
    setMessages(prev => [...prev, msg + JSON.stringify(res)])
  }, [])

  return {
    messages,
    addMessage
  }
}
