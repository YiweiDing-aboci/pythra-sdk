import { deepRequest } from './request';

export interface ShareConversationData {
  conversationId?: string;
  isShared: boolean;
  sharedAt: string | null;
  primaryCategory: string | null;
  secondaryCategory: string | null;
  tags: string[] | null;
  viewCount?: number;
}

export interface UpdateShareConversationPayload {
  chatId: string;
  makePublic: boolean;
  updateShare: number;
  messageIndex: number;
  searchQueryId: string;
}

export interface ShareConversationResponse {
  success: boolean;
  data: ShareConversationData;
}

export async function shareDeepConversation(conversationId: string): Promise<ShareConversationData> {
  const response = await deepRequest<ShareConversationData>(`/api/conversations/${conversationId}/share`, {
    method: 'GET'
  });

  return response.data;
}

export async function updateShareDeepConversation(
  conversationId: string,
  payload: UpdateShareConversationPayload
): Promise<ShareConversationData> {
  const response = await deepRequest<ShareConversationData>(`/api/conversations/${conversationId}/share`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  return response.data;
}
