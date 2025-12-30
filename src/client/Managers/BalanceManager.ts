import { getUserUsage } from "../../api/getUserUsage";

class BalanceManager {
  private searchAllowed: boolean = true;
  private researchAllowed: boolean = true;

  /**
   * 从服务器获取使用情况并更新状态
   */
  async fetchUsageStatus(): Promise<void> {
    try {
      const response = await getUserUsage();
      if (response.success) {
        this.searchAllowed = response.data.searchAllowed;
        this.researchAllowed = response.data.researchAllowed;
      }
    } catch (error) {
      console.error('BalanceManager: Failed to fetch usage status', error);
    }
  }

  /**
   * 获取 searchAllowed 状态
   * 如果当前值为 false，直接返回 false，不请求接口
   * 如果当前值为 true，请求接口验证最新状态
   */
  async getSearchAllowed(): Promise<boolean> {
    if (!this.searchAllowed) {
      return false;
    }

    await this.fetchUsageStatus();
    return this.searchAllowed;
  }

  /**
   * 获取 researchAllowed 状态
   * 如果当前值为 false，直接返回 false，不请求接口
   * 如果当前值为 true，请求接口验证最新状态
   */
  async getResearchAllowed(): Promise<boolean> {
    if (!this.researchAllowed) {
      return false;
    }

    await this.fetchUsageStatus();
    return this.researchAllowed;
  }
}

export const balanceManager = new BalanceManager();