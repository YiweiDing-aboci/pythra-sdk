interface ConversationCache {
  query: string;
  searchId: string;
}

class ConversationCacheManager {
  private cache: Map<string, ConversationCache> = new Map();

  /**
   * 存储 conversationId、query 和 searchId 的映射关系
   * @param conversationId - 会话ID
   * @param query - 查询内容
   * @param searchId - 搜索ID
   */
  store({conversationId, query, searchId}: {conversationId: string, query: string, searchId: string}): void {
    this.cache.set(conversationId, { query, searchId });
  }

  /**
   * 根据 conversationId 获取对应的 query
   * @param conversationId - 会话ID
   * @returns query 或 undefined
   */
  getQuery(conversationId: string): string | undefined {
    return this.cache.get(conversationId)?.query;
  }

  /**
   * 根据 conversationId 获取对应的 searchId
   * @param conversationId - 会话ID
   * @returns searchId 或 undefined
   */
  getSearchId(conversationId: string): string | undefined {
    return this.cache.get(conversationId)?.searchId;
  }

  /**
   * 根据 conversationId 获取完整缓存对象
   * @param conversationId - 会话ID
   * @returns ConversationCache 或 undefined
   */
  get(conversationId: string): ConversationCache | undefined {
    return this.cache.get(conversationId);
  }

  /**
   * 删除指定 conversationId 的缓存
   * @param conversationId - 会话ID
   * @returns 是否成功删除
   */
  delete(conversationId: string): boolean {
    return this.cache.delete(conversationId);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取所有缓存的 conversationId
   */
  getAllConversationIds(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * 检查是否存在指定的 conversationId
   * @param conversationId - 会话ID
   */
  has(conversationId: string): boolean {
    return this.cache.has(conversationId);
  }
}

export const conversationCacheManager = new ConversationCacheManager();
