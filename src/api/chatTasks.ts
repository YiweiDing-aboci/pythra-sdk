import { request } from './request';

/**
 * Task detail information
 */
export interface TaskDetail {
  taskId: string;
  status: string;
  createdAt: number;
  startedAt: number;
  eventCount: number;
}

/**
 * Chat task response
 */
export interface ChatTaskResponse {
  chatId: string;
  hasRunningTask: boolean;
  task: TaskDetail | null;
}

/**
 * Get tasks by chat ID
 * @param chatId - Chat ID
 * @returns Promise with chat task information
 */
export async function getTasksByChatId(
  chatId: string
): Promise<ChatTaskResponse> {
  return request<ChatTaskResponse>(`/api/ask/tasks/by-chat/${chatId}`);
}
