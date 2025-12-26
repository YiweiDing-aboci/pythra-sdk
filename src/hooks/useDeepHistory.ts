import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react"
import { extractPlainText } from "../utils/tools"
import { getDeepHistory } from "../api/chatHistory"

interface IDeepHumanMessage {
  type: "human",
  id: string,
  content: string
}

export type TTodoItem =  {
  content: string,
  status: "completed" | 'in_progress' | 'pending',
  activeForm: string
}
export type TWebSearchItem =  {
  "pageContent": string
  "metadata": {
    "title": string,
    "url": string
  }
}

export type TValidate = {
  id: string,
  content: string,
}

export type TDeepStep = {
  status: 'doing' | 'done',
  title: string,
  content: string,
  todoList?: TTodoItem[],
  sources?: TWebSearchItem[],
  validates?: TValidate[]
  results?: string
}

export interface IDeepBotMessage {
  type: "bot"
  id: string,
  content: string,
  isThinking?: boolean,
  isCreating?: boolean,
  head?: {
    title: string,
    description: string
  },
  steps?: TDeepStep[],
  sources?: TWebSearchItem[]
}

export type TDeepMessage = IDeepHumanMessage | IDeepBotMessage

export type TDeepSetMessage = Dispatch<SetStateAction<TDeepMessage[]>>

export function useDeepHistory() : {
  messages: TDeepMessage[], 
  setMessages: TDeepSetMessage,
  getHistory: (conversationId: string) => Promise<void>}
{
  const [messages, setMessages] = useState<TDeepMessage[]>([])

  const getHistory = useCallback(async (conversationId: string) => {
    const res = await requestDeepHistory(conversationId)
    setMessages(res)
  }, [])

  return {
    messages,
    setMessages,
    getHistory
  }
}

async function requestDeepHistory (conversationId: string) {
  const r1 = await getDeepHistory(conversationId)
  if (!r1.success) return []
  return r1.data.messages[0].map((m: any) => {
    if (m.role === 'user') {
      const userMessage : IDeepHumanMessage = {
        type: 'human',
        id: Date.now() + 'user',
        content: m.content
      }
      return userMessage
    } else {
      const metadata = JSON.parse(m.metadata)
      const botMessage : IDeepBotMessage = {
        type: 'bot',
        id: Date.now() + 'bot',
        content: m.content
      }
      if (metadata?.sources && metadata?.sources.length > 0) {
        botMessage.sources = metadata.sources
      }
      if (metadata?.thinkStatus) {
        botMessage.steps = processThinkStatus(metadata.thinkStatus)
      }
      return botMessage
    }
  })
}

function processThinkStatus (thinkStatus: any[]): TDeepStep[] {
  const thinkStatusToSteps: TDeepStep[] = []
  thinkStatus.forEach((step) => {
    const taskName = step?.task === 'master-orchestrator' ? 'Master Orchestrator' : step?.task  || ''
    const originStep = thinkStatusToSteps.find((step: any) => step.title === taskName);
    if (originStep) { // 如果是同一个,我就进行覆盖操作
      const status = step?.status || 'doing';
      originStep.status = status;
      originStep.content = extractPlainText(step?.thinkingContent?.reasoning || '')

      // 处理 todo List
      if (step?.toolParams?.todos) {
        originStep.todoList = step.toolParams.todos
      }

      // 处理web搜索数据
      if (step?.message === 'Validate') {
        const validates = originStep.validates || [];
        validates.push({
          id: Date.now() + 'validates',
          content: step?.content || ''
        })
        originStep.validates = [...validates]
      }
      // 处理result
      if (status === 'done') {
        originStep.results = step?.toolResult ||''
      }
    } else { // 进行新增
      const validateMessage = step?.message === 'Validate' ? step?.content : ''
      const newStep: any = {
        status: step?.status,
        title: taskName,
        content: extractPlainText(step?.thinkingContent?.reasoning || '')
      }
      if (validateMessage) {
        newStep.validates = [
          {
            id: Date.now() + 'validates',
            content: validateMessage
          }
        ]
      }
      thinkStatusToSteps.push(newStep)
    }
  })
  return thinkStatusToSteps
}