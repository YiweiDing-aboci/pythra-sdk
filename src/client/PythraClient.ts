import { test } from "../hooks/test";

/**
 * Configuration interface for PythraClient
 */
export interface PythraConfig {
  baseUrl: string;
  deepUrl: string;
  accessToken: string;
  deepAccessToken: string;
}

/**
 * Singleton client for managing global Pythra configuration
 */
class PythraClientClass {
  private config: PythraConfig | null = null;

  /**
   * Initialize the Pythra client with configuration
   * @param config - Configuration object containing baseUrl, deepUrl, accessToken, and deepAccessToken
   * @throws Error if config is invalid
   */
  configure(config: PythraConfig): void {
    test()
    if (!config.baseUrl || !config.deepUrl || !config.accessToken || !config.deepAccessToken) {
      throw new Error('PythraClient: baseUrl, deepUrl, accessToken, and deepAccessToken are required');
    }
    this.config = { ...config };
  }

  /**
   * Get the current configuration
   * @returns The current configuration
   * @throws Error if client is not configured
   */
  getConfig(): PythraConfig {
    if (!this.config) {
      throw new Error(
        'PythraClient is not configured. Please call PythraClient.configure() first.'
      );
    }
    return { ...this.config };
  }

  /**
   * Update the access token
   * @param accessToken - New access token
   */
  updateAccessToken(accessToken: string): void {
    if (!this.config) {
      throw new Error(
        'PythraClient is not configured. Please call PythraClient.configure() first.'
      );
    }
    this.config.accessToken = accessToken;
  }

  /**
   * Update the deep access token
   * @param deepAccessToken - New deep access token
   */
  updateDeepAccessToken(deepAccessToken: string): void {
    if (!this.config) {
      throw new Error(
        'PythraClient is not configured. Please call PythraClient.configure() first.'
      );
    }
    this.config.deepAccessToken = deepAccessToken;
  }

  /**
   * Get the current base URL
   * @returns The base URL
   */
  getBaseUrl(): string {
    return this.getConfig().baseUrl;
  }

  /**
   * Get the current deep URL
   * @returns The deep URL
   */
  getDeepUrl(): string {
    return this.getConfig().deepUrl;
  }

  /**
   * Get the current access token
   * @returns The access token
   */
  getAccessToken(): string {
    return this.getConfig().accessToken;
  }

  /**
   * Get the current deep access token
   * @returns The deep access token
   */
  getDeepAccessToken(): string {
    return this.getConfig().deepAccessToken;
  }

  /**
   * Check if the client is configured
   * @returns True if configured, false otherwise
   */
  isConfigured(): boolean {
    return this.config !== null;
  }

  /**
   * Reset the configuration (useful for testing)
   */
  reset(): void {
    this.config = null;
  }
}

// Export singleton instance
export const PythraClient = new PythraClientClass();
export * from "./Managers/BalanceManager"
