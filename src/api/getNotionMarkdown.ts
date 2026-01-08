import { deepRequest } from "./request";

/**
 * Notion page markdown data
 */
export interface NotionMarkdownData {
  id: string;
  title: string;
  tokenType: string;
  reportType: string;
  status: string;
  publishDate: string;
  tags: string[];
  coverUrl: string;
  summary: string;
  createdAt: string;
  lastEdited: string;
  url: string;
  content: {
    format: string;
    markdown: string;
  };
}

/**
 * Response interface for notion page markdown
 */
export interface NotionMarkdownResponse {
  success: boolean;
  data: NotionMarkdownData;
}

/**
 * Fetch notion page content in markdown format
 * @param id - Notion page ID
 * @returns Promise with notion page markdown data
 */
export async function getNotionMarkdown(
  id: string
): Promise<NotionMarkdownData> {
  const response = await deepRequest<NotionMarkdownData>(`/api/notion/pages/${id}/markdown`);
  return response.data;
}