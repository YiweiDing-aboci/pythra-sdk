import { deepRequest } from './request';

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
  // const response = await deepRequest<DeepHistoryData>(`/api/conversations/cmjzf45x40013n23rcnp1q0iv/chat`, {
  const response = await deepRequest<DeepHistoryData>(`/api/conversations/${conversationId}/chat`, {
    method: 'GET'
  });

  return response;
}
