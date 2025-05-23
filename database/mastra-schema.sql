-- MASTRA v0.10 完全対応 Supabaseスキーマ
-- 作成日: 2025-05-23
-- 機能: メッセージ管理、セマンティック検索、スレッド管理

-- ================================================
-- 1. 拡張機能の有効化
-- ================================================

-- ベクトル検索のためのpgvector拡張を有効化
CREATE EXTENSION IF NOT EXISTS vector;

-- UUID生成のための拡張を有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 2. MASTRAメッセージテーブル
-- ================================================

CREATE TABLE IF NOT EXISTS public.mastra_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL DEFAULT 'system',
    thread_id TEXT NOT NULL DEFAULT 'default',
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_mastra_messages_user_id ON public.mastra_messages (user_id);
CREATE INDEX IF NOT EXISTS idx_mastra_messages_thread_id ON public.mastra_messages (thread_id);
CREATE INDEX IF NOT EXISTS idx_mastra_messages_created_at ON public.mastra_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mastra_messages_role ON public.mastra_messages (role);

-- 複合インデックス
CREATE INDEX IF NOT EXISTS idx_mastra_messages_user_thread ON public.mastra_messages (user_id, thread_id);

-- ================================================
-- 3. MASTRAベクトルテーブル
-- ================================================

CREATE TABLE IF NOT EXISTS public.mastra_vectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL DEFAULT 'system',
    thread_id TEXT NOT NULL DEFAULT 'default',
    content TEXT NOT NULL,
    embedding vector(1536), -- OpenAI embedding dimension
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ベクトル検索用インデックス（HNSW）
CREATE INDEX IF NOT EXISTS idx_mastra_vectors_embedding 
ON public.mastra_vectors USING hnsw (embedding vector_cosine_ops);

-- 通常のインデックス
CREATE INDEX IF NOT EXISTS idx_mastra_vectors_user_id ON public.mastra_vectors (user_id);
CREATE INDEX IF NOT EXISTS idx_mastra_vectors_thread_id ON public.mastra_vectors (thread_id);
CREATE INDEX IF NOT EXISTS idx_mastra_vectors_created_at ON public.mastra_vectors (created_at DESC);

-- ================================================
-- 4. MASTRAセマンティック検索RPC関数
-- ================================================

CREATE OR REPLACE FUNCTION public.mastra_semantic_search(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 5,
    thread_id text DEFAULT NULL,
    user_id text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    content text,
    metadata jsonb,
    similarity float,
    created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.id,
        v.content,
        v.metadata,
        (1 - (v.embedding <=> query_embedding)) AS similarity,
        v.created_at
    FROM public.mastra_vectors v
    WHERE 
        (thread_id IS NULL OR v.thread_id = thread_id) AND
        (user_id IS NULL OR v.user_id = user_id) AND
        (1 - (v.embedding <=> query_embedding)) > match_threshold
    ORDER BY v.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ================================================
-- 5. MASTRAメッセージ検索RPC関数
-- ================================================

CREATE OR REPLACE FUNCTION public.mastra_get_messages(
    p_thread_id text DEFAULT NULL,
    p_user_id text DEFAULT NULL,
    p_limit int DEFAULT 40
)
RETURNS TABLE (
    id uuid,
    user_id text,
    thread_id text,
    role text,
    content text,
    metadata jsonb,
    created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.user_id,
        m.thread_id,
        m.role,
        m.content,
        m.metadata,
        m.created_at
    FROM public.mastra_messages m
    WHERE 
        (p_thread_id IS NULL OR m.thread_id = p_thread_id) AND
        (p_user_id IS NULL OR m.user_id = p_user_id)
    ORDER BY m.created_at DESC
    LIMIT p_limit;
END;
$$;

-- ================================================
-- 6. MASTRAスレッド統計RPC関数
-- ================================================

CREATE OR REPLACE FUNCTION public.mastra_get_thread_stats(
    p_user_id text DEFAULT NULL
)
RETURNS TABLE (
    thread_id text,
    message_count bigint,
    last_message_at timestamptz,
    first_message_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.thread_id,
        COUNT(*) AS message_count,
        MAX(m.created_at) AS last_message_at,
        MIN(m.created_at) AS first_message_at
    FROM public.mastra_messages m
    WHERE 
        (p_user_id IS NULL OR m.user_id = p_user_id)
    GROUP BY m.thread_id
    ORDER BY last_message_at DESC;
END;
$$;

-- ================================================
-- 7. 自動更新用トリガー
-- ================================================

-- updated_at自動更新関数
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- MASTRAメッセージテーブル用トリガー
DROP TRIGGER IF EXISTS update_mastra_messages_updated_at ON public.mastra_messages;
CREATE TRIGGER update_mastra_messages_updated_at
    BEFORE UPDATE ON public.mastra_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- MASTRAベクトルテーブル用トリガー
DROP TRIGGER IF EXISTS update_mastra_vectors_updated_at ON public.mastra_vectors;
CREATE TRIGGER update_mastra_vectors_updated_at
    BEFORE UPDATE ON public.mastra_vectors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 8. Row Level Security (RLS) 設定
-- ================================================

-- MASTRAメッセージテーブルのRLS有効化
ALTER TABLE public.mastra_messages ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが自分のデータのみアクセス可能（開発環境では無効化）
-- CREATE POLICY "Users can access own messages" ON public.mastra_messages
--     FOR ALL USING (auth.uid()::text = user_id);

-- 開発環境用：全データアクセス許可
CREATE POLICY "Allow all access for development" ON public.mastra_messages
    FOR ALL USING (true);

-- MASTRAベクトルテーブルのRLS有効化
ALTER TABLE public.mastra_vectors ENABLE ROW LEVEL SECURITY;

-- 開発環境用：全データアクセス許可
CREATE POLICY "Allow all access for development" ON public.mastra_vectors
    FOR ALL USING (true);

-- ================================================
-- 9. サンプルデータ（開発用）
-- ================================================

-- サンプルメッセージデータ
INSERT INTO public.mastra_messages (user_id, thread_id, role, content, metadata) VALUES
('system', 'welcome', 'system', 'MASTRA システムが初期化されました。', '{"type": "system_init"}'),
('user_123', 'trading_session_1', 'user', 'BTCの価格分析をお願いします', '{"symbol": "BTCUSDT"}'),
('user_123', 'trading_session_1', 'assistant', 'BTC/USDTの現在の市場分析を開始します...', '{"analysis_type": "technical"}')
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- 10. 権限設定
-- ================================================

-- 匿名ユーザーのアクセス許可（開発環境）
GRANT ALL ON public.mastra_messages TO anon;
GRANT ALL ON public.mastra_vectors TO anon;
GRANT EXECUTE ON FUNCTION public.mastra_semantic_search TO anon;
GRANT EXECUTE ON FUNCTION public.mastra_get_messages TO anon;
GRANT EXECUTE ON FUNCTION public.mastra_get_thread_stats TO anon;

-- 認証済みユーザーのアクセス許可
GRANT ALL ON public.mastra_messages TO authenticated;
GRANT ALL ON public.mastra_vectors TO authenticated;
GRANT EXECUTE ON FUNCTION public.mastra_semantic_search TO authenticated;
GRANT EXECUTE ON FUNCTION public.mastra_get_messages TO authenticated;
GRANT EXECUTE ON FUNCTION public.mastra_get_thread_stats TO authenticated;

-- サービスロールのアクセス許可
GRANT ALL ON public.mastra_messages TO service_role;
GRANT ALL ON public.mastra_vectors TO service_role;
GRANT EXECUTE ON FUNCTION public.mastra_semantic_search TO service_role;
GRANT EXECUTE ON FUNCTION public.mastra_get_messages TO service_role;
GRANT EXECUTE ON FUNCTION public.mastra_get_thread_stats TO service_role;

-- ================================================
-- ✅ スキーマ作成完了
-- ================================================

-- 確認用クエリ
SELECT 'MASTRA Schema created successfully!' AS status;
SELECT 'Tables created:' AS info, COUNT(*) AS table_count 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'mastra_%';

SELECT 'Functions created:' AS info, COUNT(*) AS function_count 
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name LIKE 'mastra_%'; 