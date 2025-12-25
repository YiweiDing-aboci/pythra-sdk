import { useState, useCallback } from "react"

export function useDeepHistory() {
  const [messages, setMessages] = useState<string[]>([])

  const addMessage = useCallback((msg: string) => {
    console.log('🚀🚀🚀🚀🚀🚀🚀🚀\n\n\n\n','出嘿111133嘿','\n\n\n\n🎈🎈🎈🎈🎈🎈🎈🎈🎈')
    setMessages(prev => [...prev, msg + 'dingkaile'])
  }, [])

  return {
    messages,
    addMessage
  }
}
