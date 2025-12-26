import { deepRequest } from '../client/request';

/**
 * Chat message
 */
interface ChatMessage {
  id: string;
  content: string;
  chatId: string;
  searchId: string;
  messageId: string;
  role: 'user' | 'assistant';
  stopped?: boolean;
  metadata: string;
  feedbackType: number;
}

/**
 * Chat details
 */
interface Chat {
  id: string;
  title: string;
  createdAt: string;
  focusMode: string;
  files: any[];
  userId: string;
  type: string;
  source: string | null;
  teamId: string | null;
  turnCount: number;
}

/**
 * Deep history data
 */
interface DeepHistoryData {
  chat: Chat;
  messages: ChatMessage[][];
}

/**
 * Response for getting deep history
 */
interface DeepHistoryResponse {
  success: boolean;
  data: DeepHistoryData;
}

/**
 * Get conversation history
 * @param conversationId - The conversation ID
 * @returns Promise with conversation history data
 * @internal
 */
export async function getDeepHistory(conversationId: string): Promise<DeepHistoryResponse> {
  console.log('🚀🚀🚀🚀🚀🚀🚀🚀\n\n\n\n','丁凯乐来拿数据了 出来吧神龙','\n\n\n\n🎈🎈🎈🎈🎈🎈🎈🎈🎈')
  const response = await deepRequest<DeepHistoryResponse>(`/api/conversations/${conversationId}/chat`, {
    method: 'GET'
  });

  return response;
}
