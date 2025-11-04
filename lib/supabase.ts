import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UsageLog = {
  id: string;
  user_id: string;
  message: string;
  tone: 'shorter' | 'spicier' | 'softer';
  created_at: string;
};

export type UserProfile = {
  id: string;
  email: string;
  subscription_status: 'free' | 'monthly' | 'annual';
  subscription_id?: string;
  usage_count: number;
  created_at: string;
};
