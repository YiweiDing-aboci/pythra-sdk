import { deepRequest } from '../client/request';
import { PythraClient } from '../client/PythraClient';

/**
 * Conversation data
 */
interface ConversationData {
  conversationId: string;
  createdAt: string;
  estimatedTime: number;
}

/**
 * Response for creating conversation
 */
interface CreateConversationResponse {
  success: boolean;
  data: ConversationData;
}

/**
 * Create a new conversation and get conversation ID
 * @param query - The query string
 * @returns Promise with conversation data
 * @internal
 */
export async function createConversation(query: string): Promise<ConversationData> {
  const accessToken = PythraClient.getAccessToken();

  const response = await deepRequest<CreateConversationResponse>('/api/conversations/start', {
    method: 'POST',
    body: {
      alfagptToken: accessToken,
      query,
      agent: 'cab',
    },
  });

  return response.data;
}
