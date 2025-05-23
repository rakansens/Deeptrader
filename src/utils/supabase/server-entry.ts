'use server';

// src/utils/supabase/server-entry.ts
// サーバーコンポーネント用のエントリーポイント

import { createServerSupabase as serverClient } from './server';
import { createRouteHandlerClient as originalCreateRouteHandlerClient } from './route-handler';
import { createServiceRoleClient as originalCreateServiceRoleClient } from './service-role';
import { updateSession as originalUpdateSession } from './middleware';
import type { NextRequest } from 'next/server';

// サーバーコンポーネント用
export async function createServerClient() {
  return await serverClient();
}

// APIルートハンドラー用
export async function createRouteHandlerClient() {
  return await originalCreateRouteHandlerClient();
}

// サービスロール用
export async function createServiceRoleClient() {
  return await originalCreateServiceRoleClient();
}

// ミドルウェア用
export async function updateSession(request: NextRequest) {
  return await originalUpdateSession(request);
} 