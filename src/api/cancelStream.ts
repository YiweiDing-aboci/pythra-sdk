import { deepRequest } from './request';
import { PythraClient } from '../client/PythraClient';

export interface CancelStreamResponse {
  searchId: string;
  message: string;
  status: string;
}

export async function cancelStream(searchId: string): Promise<CancelStreamResponse> {
  const alfagptToken = PythraClient.getAccessToken();

  const response = await deepRequest<CancelStreamResponse>(`/api/search/${searchId}/stop`, {
    method: 'POST',
    body: {alfagptToken}
  });

  return response.data;
}
