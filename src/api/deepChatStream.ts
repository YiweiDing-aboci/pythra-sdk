import { DeepSetMessage } from "../types";
import { PythraClient } from '../client/PythraClient';


interface SendStreamRequestParams {
  conversationId: string;
  query: string;
  retry?: boolean;
  setMessages: DeepSetMessage;
}

export async function sendStreamRequest (params: SendStreamRequestParams) {
  const { conversationId, query, retry = false, setMessages } = params;
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

    xhr.open('POST', `${deepUrl}/api/conversations/${conversationId}/stream`, true);
    xhr.setRequestHeader('Content-Type', 'application/json, text/event-stream');
    xhr.setRequestHeader('Accept', '*/*');
    xhr.setRequestHeader('Cache-Control', 'no-cache');
    xhr.setRequestHeader('Authorization', `Bearer ${deepAccessToken}`);

    // 设置超时时间 (30分钟)
    xhr.timeout = 30 * 60 * 1000;

    xhr.onprogress = () => {
        const newData = xhr.responseText.substring(lastProcessedIndex);
        lastProcessedIndex = xhr.responseText.length;
        
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
                  setMessages(pre => {
                    const lastMessage = pre.pop()!;
                    if (lastMessage?.type && lastMessage.type === 'bot') {
                      lastMessage.isThinking = false;
                      lastMessage.content += chunk?.data || ''
                    }
                    return [...pre, lastMessage!]
                  })
                } else if (chunk?.type === 'messageEnd') { // 处理工具数据
                  setMessages(pre => {
                    const lastMessage = pre.pop()!;
                    if (lastMessage?.type && lastMessage.type === 'bot') {
                      lastMessage.isCreating = false;
                    }
                    return [...pre, lastMessage!]
                  })
                }

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
        readyState: xhr.readyState,
        status: xhr.status,
        statusText: xhr.statusText,
        responseURL: xhr.responseURL,
        event: ev
      });

      let errorMessage = '网络请求失败';
      if (xhr.status === 0) {
        errorMessage = '无法连接到服务器，请检查网络连接或服务器是否可用';
      } else if (xhr.status >= 400 && xhr.status < 500) {
        errorMessage = `客户端错误 (${xhr.status})`;
      } else if (xhr.status >= 500) {
        errorMessage = `服务器错误 (${xhr.status})`;
      }

      reject(new Error(errorMessage));
    };

    xhr.ontimeout = () => {
      reject(new Error('请求超时'));
    };

    xhr.send(JSON.stringify({
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


function extractPlainText(markdown: string): string {
  return markdown
    .replace(/[*#`_~\[\]()]/g, '') // 移除 markdown 格式字符
    .replace(/\n/g, '') // 移除换行
    .trim()
    .slice(0, 50);
}