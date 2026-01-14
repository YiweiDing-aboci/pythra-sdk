import { deepRequest } from './request';

/**
 * Message duration response data
 */
export interface MessageDuration {
  messageId: string;
  searchId: string;
  durationMs: number;
  createdAt: string;
}

/**
 * Cache for message duration data
 */
const durationCache = new Map<string, MessageDuration>();

/**
 * Get message duration by message ID
 * @param messageId - The message ID
 * @returns Promise with message duration data
 */
export async function getMessageDuration(messageId: string): Promise<MessageDuration> {
  // Check cache first
  const cached = durationCache.get(messageId);
  if (cached) {
    return cached;
  }

  // Fetch from API if not cached
  const response = await deepRequest<MessageDuration>(
    `/api/search/messages/${messageId}/duration`,
    {
      method: 'GET',
      headers: {
        'lang': 'en',
      },
    }
  );

  // Store in cache
  durationCache.set(messageId, response.data);

  return response.data;
}
