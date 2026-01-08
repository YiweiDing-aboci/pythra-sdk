import { deepRequest } from './request';

export interface ShareConversationData {
  isShared: boolean;
  sharedAt: string | null;
  primaryCategory: string | null;
  secondaryCategory: string | null;
  tags: string[] | null;
  viewCount: number;
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
