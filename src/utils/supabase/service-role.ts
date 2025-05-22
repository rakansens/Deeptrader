'use server';

// src/utils/supabase/service-role.ts
// サービスロール（管理者権限）用のSupabaseクライアント

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types';
import { logger } from '@/lib/logger';
import { SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env.server';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * サービスロール（管理者権限）用のSupabaseクライアントを作成
 */
export async function createServiceRoleClient() {
  if (typeof window !== 'undefined') {
    throw new Error('Service role client cannot be used on the client side');
  }
  
  if (!SUPABASE_URL) {
    throw new Error('SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL must be set');
  }
  
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY must be set');
  }
  
  return createClient<Database>(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
} 