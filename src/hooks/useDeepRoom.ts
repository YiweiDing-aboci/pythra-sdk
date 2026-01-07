import { useCallback, useEffect, useRef, useState } from "react";
import { DeepMessage } from "../types";
import { createConversation } from "../api/conversation";
import { sendStreamRequest } from "../api/deepChatStream";
import { useDeepHistory } from "./useDeepHistory";
import { getRecommend } from "../api/recommend";

export function useDeepRoom() {
  const abortRef = useRef<(() => void) | null>(null);
  const [conversationId, setConversationId] = useState<string | null>()
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const {messages, setMessages, getHistory: requestHistory} = useDeepHistory()

  const getConversationId = useCallback(async(query: string) => {
    const res = await createConversation(query)
    setConversationId(res.conversationId)
    return res.conversationId
  }, [])

  const sendMessage = useCallback(async(query: string, searchId = '') => {
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
      },
      processData: {
        content: '',
        entityButtons: {},
        sourceButtons:  {},
        chartButtons: {},
        entities: [],
        jsonButtons: {}
      }
    }
    setMessages(pre => ([...pre, newUserMessage, newBotMessage]))

    let currentId = conversationId
    if (!currentId) {
      currentId = await getConversationId(query)
    }
    const { promise, abort } = sendStreamRequest({
      conversationId: currentId as '',
      query,
      setMessages,
      searchId
    })
    abortRef.current = abort
    setIsWaitingForResponse(true)
    await promise
    setIsWaitingForResponse(false)

    // 等待流式请求结束后，获取推荐问题
    try {
      const recommendData = await getRecommend(query)
      setRecommendations(recommendData.relatedQueries)
    } catch (error) {
      console.error('获取推荐问题失败:', error)
      setRecommendations([])
    }
  }, [conversationId, getConversationId, setMessages])

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current()
      }
    }
  }, [])

  const getHistory = useCallback(async(id: string) => {
    const res = await requestHistory(id)
    if (res) {
      if (res.searchId) {
        setMessages(pre => {
          if (pre.length > 0) {
            return pre.slice(0, -2);
          }
          return pre;
        });
        sendMessage(res.query, res.searchId);
      } else {
        try {
          const recommendData = await getRecommend(res.query)
          setRecommendations(recommendData.relatedQueries)
        } catch (error) {
          console.error('获取推荐问题失败:', error)
          setRecommendations([])
        }
      }
    }
    return Promise.resolve(true)
  }, [sendMessage])

  return {
    messages,
    getHistory,
    sendMessage,
    setConversationId,
    recommendations,
    isWaitingForResponse
  }
}