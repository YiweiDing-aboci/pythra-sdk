import { chunkTest } from "../mock/chunk copy";
import { DeepSetMessage } from "../types";
import { processDeepMessage } from "../utils/processDeepMessage/processDeepMessage";
import { extractPlainText } from "../utils/tools";

interface SendStreamRequestParams {
  conversationId: string;
  query: string;
  retry?: boolean;
  setMessages: DeepSetMessage;
}

export async function sendStreamRequest (params: SendStreamRequestParams) {
  const {setMessages} = params;
  const promise = new Promise<void>(async(resolve, reject) => {
    let responseMessage = ''
    for (let index = 0; index < chunkTest.length; index++) {
      const chunk: any = chunkTest[index];
      await new Promise(resolve => setTimeout(resolve, 500));
      //#region 处理片段
      if (chunk?.type === 'think') {
        setMessages(pre => {
          const lastMessage = pre.pop()!;
          if (lastMessage?.type && lastMessage.type === 'bot') {
            const steps = lastMessage?.steps || [];
            const taskName = chunk?.data?.task === 'master-orchestrator' ? 'Master Orchestrator' : chunk?.data?.task || ''
            const originStep = steps.find((step: any) => step.title === taskName);
            if (originStep) { // 如果是同一个,我就进行覆盖操作
              const status = chunk?.data?.status || 'doing';
              originStep.status = status;
              originStep.content = extractPlainText(chunk?.data?.thinkingContent?.reasoning || '')

              // 处理 todo List
              if (chunk?.data?.toolParams?.todos) {
                originStep.todoList = chunk.data.toolParams.todos
              }

              // 处理web搜索数据
              if (chunk?.data?.message === 'Validate') {
                const validates = originStep.validates || [];
                validates.push({
                  id: Date.now() + 'validates',
                  content: chunk?.data?.content || ''
                })
                originStep.validates = [...validates]
              }
              // 处理result
              if (status === 'done') {
                originStep.results = chunk?.data?.toolResult ||''
              }
            } else { // 进行新增
              const validateMessage = chunk?.data?.message === 'Validate' ? chunk?.data?.content : ''
              const newStep: any = {
                status: chunk?.data?.status,
                title: taskName,
                content: extractPlainText(chunk?.data?.thinkingContent?.reasoning || '')
              }
              if (validateMessage) {
                newStep.validates = [
                  {
                    id: Date.now() + 'validates',
                    content: validateMessage
                  }
                ]
              }
              steps.push(newStep)
            }
            lastMessage.steps = [...steps];
          }
          return [...pre, lastMessage!]
        })
      } else if (chunk?.type === 'sources') { // 处理web搜索数据
        setMessages(pre => {
          const lastMessage = pre.pop()!;
          if (lastMessage?.type && lastMessage.type === 'bot') {
            lastMessage.sources = chunk?.data || []
            const steps = lastMessage?.steps || [];
            const originStep = steps.find((step: any) => step.title === 'Master Orchestrator');
            if (originStep) { // 如果是同一个,我就进行覆盖操作
              originStep.sources = chunk?.data || []
            } else { // 进行新增
              steps.push({
                status: 'doing',
                title: 'Master Orchestrator',
                content: '',
                sources: chunk?.data || []
              })
            }
            lastMessage.steps = [...steps];
          }
          return [...pre, lastMessage!]
        })
      } else if (chunk?.type === 'message') { // 处理工具数据
        responseMessage += chunk?.data || ''
        const processResult = await processDeepMessage(responseMessage)
        setMessages(pre => {
          const lastMessage = pre.pop()!;
          if (lastMessage?.type && lastMessage.type === 'bot') {
            lastMessage.isThinking = false;
            lastMessage.content = responseMessage
            lastMessage.processData = processResult
          }
          return [...pre, lastMessage!]
        })
      } else if (chunk?.type === 'messageEnd') { // 处理工具数据
        const processResult = await processDeepMessage(responseMessage, true)
        setMessages(pre => {
          const lastMessage = pre.pop()!;
          if (lastMessage?.type && lastMessage.type === 'bot') {
            lastMessage.isCreating = false;
            lastMessage.processData = processResult
          }
          return [...pre, lastMessage!]
        })
      }
      //#endregion
    }
    resolve()
  });

  return {
    promise,
    abort: () => {}
  };
};