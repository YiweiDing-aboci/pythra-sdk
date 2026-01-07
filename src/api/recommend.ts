import { deepRequest } from './request';

export interface RecommendData {
  originalQuery: string;
  relatedQueries: string[];
  count: number;
}

export interface RecommendResponse {
  success: boolean
  data: RecommendData;
}

export async function getRecommend(query: string): Promise<RecommendData> {
  const response = await deepRequest<RecommendResponse>('/api/search/recommend', {
    method: 'POST',
    body: {
      query
    }
  });

  return response.data;
}
