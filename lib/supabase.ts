import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: Platform.OS === 'web' ? window.localStorage : AsyncStorage,
  },
});

export type Database = {
  public: {
    Tables: {
      deals: {
        Row: {
          id: string;
          title: string;
          description: string;
          image_url: string;
          regular_price: number;
          sale_price: number;
          quantity_total: number;
          quantity_remaining: number;
          start_date: string;
          end_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['deals']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['deals']['Insert']>;
      };
      purchases: {
        Row: {
          id: string;
          deal_id: string;
          customer_email: string;
          customer_name: string;
          purchase_price: number;
          status: 'pending' | 'completed' | 'failed' | 'refunded';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['purchases']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['purchases']['Insert']>;
      };
    };
  };
};
