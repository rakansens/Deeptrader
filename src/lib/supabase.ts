// src/lib/supabase.ts
// Supabaseクライアントの初期化

import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types";
import { logger } from "@/lib/logger";

// クライアントサイドの環境変数のみをインポート
import {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
} from "@/lib/env.client";

// 環境変数から取得した情報でクライアントを初期化
const supabaseUrl = NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 型付きSupabaseクライアントの作成
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// サーバーサイドのみで使用するクライアント（管理者権限）
export const createServiceRoleClient = () => {
  // サーバーサイドでのみ実行されるようにする
  if (typeof window !== "undefined") {
    logger.error("❌ Service role client should only be used on the server");
    return supabase; // クライアントサイドでは通常のクライアントを返す
  }

  // サーバーサイドでのみサービスロールキーをインポート
  const { SUPABASE_SERVICE_ROLE_KEY } = require("@/lib/env.server");
  
  return createClient<Database>(supabaseUrl, SUPABASE_SERVICE_ROLE_KEY);
};
