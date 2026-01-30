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
const durationCache = new Map<string, string>();

/**
 * Get message duration by message ID
 * @param messageId - The message ID
 * @returns Promise with message duration data
 */
export async function getMessageDuration(messageId: string): Promise<string> {
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

  let duration = ''

  if (response.data?.durationMs) {
    duration = formatTime(response.data?.durationMs/1000)
  }

  // Store in cache
  durationCache.set(messageId, duration);

  return duration;
}

function formatTime(seconds: number): string {
  seconds = Math.floor(seconds);
  
  const hours: number = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes: number = Math.floor(seconds / 60);
  seconds %= 60;

  let timeString: string = '';
  
  if (hours > 0) {
      timeString += `${hours}h`;
  }
  if (minutes > 0) {
      timeString += `${minutes}m`;
  }
  if (seconds > 0 || timeString === '') { // 确保在0秒时也返回
      timeString += `${seconds}s`;
  }

  return timeString;
}