// Types Supabase — source unique : src/lib/pricing.ts pour PlanId
import { PlanId } from '@/lib/pricing';

export type UserPlan = PlanId;

export interface Profile {
  id: string;
  email: string;
  plan: UserPlan;
  credit_balance: number;
  subscription_status: string | null;
  billing_cycle: 'monthly' | 'annual' | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  payment_provider: string | null;
  fedapay_transaction_id: string | null;
  momo_phone: string | null;
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
  png_exports_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  delta: number;
  reason: string;
  stripe_event_id: string | null;
  created_at: string;
}

export interface AppEvent {
  id: string;
  user_id: string | null;
  event_name: string;
  properties: Record<string, unknown>;
  session_id: string | null;
  created_at: string;
}
