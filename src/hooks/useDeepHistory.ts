import { useCallback, useState } from "react"
import { extractPlainText } from "../utils/tools"
import { getDeepHistory } from "../api/chatHistory"
import { DeepBotMessage, DeepHumanMessage, DeepMessage, DeepSetMessage, DeepStep } from "../types"
import { processDeepMessage } from "../utils/processDeepMessage/processDeepMessage"

export function useDeepHistory() : {
  messages: DeepMessage[],
  setMessages: DeepSetMessage,
  getHistory: (conversationId: string) => Promise<any>}
{
  const [messages, setMessages] = useState<DeepMessage[]>([])

  const getHistory = useCallback(async (conversationId: string) => {
    const res = await requestDeepHistory(conversationId)
    setMessages(res.history)

    // 后台处理 bot 消息，逐个更新 processData
    setTimeout(async() => {
      for (let i = 0; i < res.length; i++) {
        const m = res[i]
        if (m.type === 'bot') {
          try {
            const processResult = await processDeepMessage(m.content, true)

            setMessages(prev => {
              const updated = [...prev]
              updated[i] = {
                ...updated[i],
                processData: processResult
              } as DeepBotMessage
              return updated
            })
          } catch (error) {
            console.error('Failed to process bot message:', error)
          }
        }
      }
    }, 500)
    return res.resumeData
  }, [])

  return {
    messages,
    setMessages,
    getHistory
  }
}

async function requestDeepHistory (conversationId: string) : Promise<any> {
  const history: DeepMessage[] = []
  const historyResponse = await getDeepHistory(conversationId)
  if (!historyResponse.success) return {history, resumeData: false}
  const historyResult = historyResponse.data.messages[0]
  let resumeData: any = false
  if (historyResult.length > 0 && historyResult[historyResult.length - 1].role === 'assistant' && !historyResult[historyResult.length - 1]?.content) {
    resumeData = {
      searchId: historyResult[historyResult.length - 1].searchId,
      query:  historyResult[historyResult.length - 2].content,
    }
  }

  for (const m of historyResult) {
    if (m.role === 'user') {
      const userMessage: DeepHumanMessage = {
        type: 'human',
        id: Date.now() + 'user',
        content: m.content
      }
      history.push(userMessage)
    } else {
      const metadata = JSON.parse(m.metadata)
      const botMessage: DeepBotMessage = {
        type: 'bot',
        id: Date.now() + 'bot',
        content: m.content,
        processData: await processDeepMessage(m.content)
      }
      if (metadata?.sources && metadata?.sources.length > 0) {
        botMessage.sources = metadata.sources
      }
      if (metadata?.thinkStatus) {
        botMessage.steps = processThinkStatus(metadata.thinkStatus)
      }
      history.push(botMessage)
    }
  }
  
  return {history, resumeData: resumeData}
}

function processThinkStatus (thinkStatus: any[]): DeepStep[] {
  const thinkStatusToSteps: DeepStep[] = []
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