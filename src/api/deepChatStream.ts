import { DeepSetMessage } from "../types";
import { PythraClient } from '../client/PythraClient';
import { processDeepMessage } from "../utils/processDeepMessage/processDeepMessage";
import { conversationCacheManager } from "../client/Managers/ConversationCacheManager";
import { extractPlainText } from "../utils/tools";


interface SendStreamRequestParams {
  conversationId: string;
  query: string;
  retry?: boolean;
  setMessages: DeepSetMessage;
  searchId?: string;
}

export function sendStreamRequest (params: SendStreamRequestParams) : {promise: Promise<void>, abort: () => void} {
  const { conversationId, query, retry = false, setMessages, searchId = '' } = params;
  let xhr: XMLHttpRequest | null = null;

  const {deepUrl, deepAccessToken, accessToken} = PythraClient.getConfig()

  const promise = new Promise<void>((resolve, reject) => {
    // 检查网络连接状态
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      reject(new Error('设备未连接到网络，请检查网络设置'));
      return;
    }

    xhr = new XMLHttpRequest();
    let buffer = '';
    let lastProcessedIndex = 0;

    xhr.open('POST', 
      searchId ? `${deepUrl}/api/conversations/resume/${searchId}` 
        : `${deepUrl}/api/conversations/${conversationId}/stream`,
      true);
    xhr.setRequestHeader('Content-Type', 'application/json, text/event-stream');
    xhr.setRequestHeader('Accept', '*/*');
    xhr.setRequestHeader('Cache-Control', 'no-cache');
    xhr.setRequestHeader('Authorization', `Bearer ${deepAccessToken}`);

    // 设置超时时间 (30分钟)
    xhr.timeout = 30 * 60 * 1000;

    let responseMessage = ''

    xhr.onprogress = async() => {
        const newData = xhr!.responseText.substring(lastProcessedIndex);
        lastProcessedIndex = xhr!.responseText.length;
        
        if (newData) {
          buffer += newData;
          
          // 处理缓冲区数据
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // 保留最后一行
          
          for (const line of lines) {
            if (line.trim() === '') continue;
            
            // 处理服务器发送的事件流数据
            if (line.startsWith('data: ')) {
              const jsonStr = line.substring(6);
              if (jsonStr.trim() === '[DONE]') {
                resolve();
                return;
              }
              
              try {
                const chunk = JSON.parse(jsonStr);
                console.log(conversationId+searchId, '🚀🚀🚀🚀🚀🚀🚀🚀\n\n\n\n', chunk,'\n\n\n\n🎈🎈🎈🎈🎈🎈🎈🎈🎈')
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
                      lastMessage.conversationId = conversationId
                      const steps = lastMessage?.steps || []
                      steps.forEach((step: any) => {
                        step.status = 'done';
                      })
                    }
                    return [...pre, lastMessage!]
                  })
                  conversationCacheManager.delete(conversationId);
                  resolve();
                } else if (chunk?.success) {
                  conversationCacheManager.store({
                    conversationId,
                    query: query,
                    searchId: chunk?.data?.searchId,
                  })
                }
                //#endregion

              } catch (parseError) {
                console.warn('解析JSON失败:', parseError, '原始数据:', jsonStr);
              }
            }
          }
      }
    };

    xhr.onload = () => {
      resolve();
    };

    xhr.onerror = (ev: ProgressEvent<EventTarget>) => {
      console.error('XMLHttpRequest 错误:', {
        readyState: xhr!.readyState,
        status: xhr!.status,
        statusText: xhr!.statusText,
        responseURL: xhr!.responseURL,
        event: ev
      });

      let errorMessage = '网络请求失败';
      if (xhr!.status === 0) {
        errorMessage = '无法连接到服务器，请检查网络连接或服务器是否可用';
      } else if (xhr!.status >= 400 && xhr!.status < 500) {
        errorMessage = `客户端错误 (${xhr!.status})`;
      } else if (xhr!.status >= 500) {
        errorMessage = `服务器错误 (${xhr!.status})`;
      }

      reject(new Error(errorMessage));
    };

    xhr.ontimeout = () => {
      reject(new Error('请求超时'));
    };

    xhr.send(JSON.stringify(searchId ? {
      query,
      retry,
      alfagptToken: PythraClient.getAccessToken()
    } : {
      query,
      retry,
      accessToken
    }))
  });

  return {
    promise,
    abort: () => {
      if (xhr) {
        xhr.abort();
      }
    }
  };
};