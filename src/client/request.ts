import { PythraClient } from './PythraClient';

/**
 * Internal request options
 */
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
}

/**
 * Internal function to make requests to baseUrl
 * @param endpoint - API endpoint (e.g., '/users')
 * @param options - Request options
 * @returns Promise with response data
 * @internal
 */
export async function request<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const baseUrl = PythraClient.getBaseUrl();
  const accessToken = PythraClient.getAccessToken();

  const { method = 'GET', headers = {}, body } = options;

  const url = `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Internal function to make requests to deepUrl
 * @param endpoint - API endpoint (e.g., '/deep-api')
 * @param options - Request options
 * @returns Promise with response data
 * @internal
 */
export async function deepRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const deepUrl = PythraClient.getDeepUrl();
  const deepAccessToken = PythraClient.getDeepAccessToken();

  const { method = 'GET', headers = {}, body } = options;

  const url = `${deepUrl}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${deepAccessToken}`,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Deep request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
