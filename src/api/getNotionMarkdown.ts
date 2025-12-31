import { deepRequest } from "./request";

/**
 * Response interface for notion page markdown
 */
export interface NotionMarkdownResponse {
  success: boolean;
  data: {
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
  };
}

/**
 * Fetch notion page content in markdown format
 * @param id - Notion page ID
 * @returns Promise with notion page markdown data
 */
export async function getNotionMarkdown(
  id: string
): Promise<NotionMarkdownResponse> {
  return deepRequest<NotionMarkdownResponse>(`/api/notion/pages/${id}/markdown`);
}