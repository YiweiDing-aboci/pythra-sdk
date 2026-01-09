/**
 * PendingQuestionManager
 * 管理用户即将提出的问题（单个字符串存储）
 */
export class PendingQuestionManager {
  private pendingQuestion: string | null = null;

  /**
   * 存储待提问的问题
   * @param question 问题字符串
   */
  setQuestion(question: string): void {
    this.pendingQuestion = question;
  }

  /**
   * 获取存储的问题
   * @returns 存储的问题字符串，如果没有则返回 null
   */
  getQuestion(): string | null {
    return this.pendingQuestion;
  }

  /**
   * 清理存储的问题
   */
  clearQuestion(): void {
    this.pendingQuestion = null;
  }

  /**
   * 检查是否有待提问的问题
   * @returns 如果有问题返回 true，否则返回 false
   */
  hasQuestion(): boolean {
    return this.pendingQuestion !== null;
  }
}
