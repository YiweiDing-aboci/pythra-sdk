import { request } from './request';

export interface Entity {
  text: string;
  matched_entity: string;
  type: 'token' | 'project' | string;
  start: number;
  end: number;
  language: string;
  context: string | null;
}

export interface ChatExtractResponse {
  entities: Entity[];
  count: number;
  language_detected: string;
}

export async function getChatExtract(text: string): Promise<ChatExtractResponse> {
  const response = await request('/api/extract', {
    method: 'POST',
    body: { text }
  });

  return response;
}
