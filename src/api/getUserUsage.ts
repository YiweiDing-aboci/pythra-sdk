import { request } from "./request";

interface UsageLimitDetail {
  total: number;
  interval: string;
}

interface UsagePeriod {
  start: string;
  end: string;
}

interface UsageQuotaExtra {
  total: number;
  details: any[];
}

interface UsageQuota {
  base: UsageQuotaBase;
  extra: UsageQuotaExtra;
  total: number;
}

interface UsageQuotaBase {
  total: number;
  details: any[];
}

interface UsageCheckLimit {
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
}

interface UsageQuotas {
  search: UsageQuota;
  research: UsageQuota;
}

interface UsageLimits {
  search: UsageLimitDetail[];
  research: UsageLimitDetail[];
}

interface UsageLimit {
  id: number;
  limits: UsageLimits;
  planType: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

interface UsageData {
  membershipLevel: string;
  limits: UsageLimit[];
  period: UsagePeriod;
  quotas: UsageQuotas;
  searchUsed: number;
  searchAllowed: boolean;
  checkSearchUsageLimit: UsageCheckLimit;
  researchUsed: number;
  researchAllowed: boolean;
  checkResearchUsageLimit: UsageCheckLimit;
  date: string;
}

export interface UsageResponse {
  success: boolean;
  data: UsageData;
}

export async function getUserUsage(): Promise<UsageResponse> {
  const response = await request<UsageResponse>('/api/user/usage', {
    method: 'GET'
  });
  return response
}