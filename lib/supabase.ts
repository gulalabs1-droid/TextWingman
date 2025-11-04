import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
} else {
  if (typeof window === 'undefined') {
    console.warn('Supabase credentials not configured. Usage tracking will be disabled.');
  }
}

export const supabase = supabaseInstance;

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
