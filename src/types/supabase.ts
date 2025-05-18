// src/types/supabase.ts
// Supabaseデータベース型定義

/**
 * Supabaseで使用するデータベースの型定義
 * スキーマから自動生成する場合は、以下のコマンドを使用:
 * npx supabase gen types typescript --project-id <プロジェクトID> --schema public > src/types/supabase.ts
 */
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          updated_at: string;
          full_name: string | null;
          avatar_url: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
          updated_at?: string;
          full_name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
          full_name?: string | null;
          avatar_url?: string | null;
        };
      };
      
      trading_strategies: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
          is_active: boolean;
          config: Json;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
          config: Json;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
          config?: Json;
        };
      };

      trading_history: {
        Row: {
          id: string;
          user_id: string;
          strategy_id: string | null;
          symbol: string;
          type: 'buy' | 'sell';
          quantity: number;
          price: number;
          timestamp: string;
          status: 'pending' | 'completed' | 'cancelled' | 'failed';
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          strategy_id?: string | null;
          symbol: string;
          type: 'buy' | 'sell';
          quantity: number;
          price: number;
          timestamp?: string;
          status?: 'pending' | 'completed' | 'cancelled' | 'failed';
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          strategy_id?: string | null;
          symbol?: string;
          type?: 'buy' | 'sell';
          quantity?: number;
          price?: number;
          timestamp?: string;
          status?: 'pending' | 'completed' | 'cancelled' | 'failed';
          metadata?: Json | null;
        };
      };
    };
    
    Views: {
      [_ in never]: never;
    };
    
    Functions: {
      [_ in never]: never;
    };
    
    Enums: {
      [_ in never]: never;
    };
  };
};

// JSON型の定義
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]; 