// src/utils/supabase/index.ts
// Supabaseクライアント共通エントリーポイント
// 最適化のため、個別のエントリーポイントの使用を推奨

// クライアントコンポーネント用
export { createClient as createBrowserClient } from './client';

// サーバーコンポーネント用
export { createServerClient } from './server';

// APIルートハンドラー用
export { createRouteHandlerClient } from './route-handler';

// サービスロール（管理者権限）用
export { createServiceRoleClient } from './service-role';

// ミドルウェア用
export { updateSession } from './middleware'; 