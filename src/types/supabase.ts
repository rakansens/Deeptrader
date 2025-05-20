// src/types/supabase.ts
// Supabaseデータベース型定義

/**
 * Supabaseで使用するデータベースの型定義
 * スキーマから自動生成する場合は、以下のコマンドを使用:
 * npx supabase gen types typescript --project-id <プロジェクトID> --schema public > src/types/supabase.ts
 */
import type { OrderSide } from "./order";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          created_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: number;
          conversation_id: string;
          sender: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          conversation_id: string;
          sender: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          conversation_id?: string;
          sender?: string;
          content?: string;
          created_at?: string;
        };
      };
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
          type: OrderSide;
          quantity: number;
          price: number;
          timestamp: string;
          status: "pending" | "completed" | "cancelled" | "failed";
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          strategy_id?: string | null;
          symbol: string;
          type: OrderSide;
          quantity: number;
          price: number;
          timestamp?: string;
          status?: "pending" | "completed" | "cancelled" | "failed";
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          strategy_id?: string | null;
          symbol?: string;
          type?: OrderSide;
          quantity?: number;
          price?: number;
          timestamp?: string;
          status?: "pending" | "completed" | "cancelled" | "failed";
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
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];
