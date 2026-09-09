export type UserPlan = 'free' | 'pro' | 'agence';

export interface Profile {
  id: string;
  email: string;
  plan: UserPlan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsageRecord {
  id: string;
  user_id: string | null;
  client_ip: string | null;
  month: string; // YYYY-MM
  analyses_ia_count: number;
  exports_count: number;
  created_at: string;
  updated_at: string;
}
