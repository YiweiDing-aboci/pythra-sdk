import { useState, useCallback } from "react"

export function useDeepHistory() {
  const [messages, setMessages] = useState<string[]>([])

  const addMessage = useCallback((msg: string) => {
    setMessages(prev => [...prev, msg])
  }, [])

  return {
    messages,
    addMessage
  }
}