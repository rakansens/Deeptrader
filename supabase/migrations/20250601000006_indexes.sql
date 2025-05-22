-- migrate:up
-- インデックスと制約を追加するスクリプト
-- 作成日: 2025/6/1
-- 更新内容: パフォーマンス向上のためのインデックス定義

-- ユーザー関連インデックス
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON public.users(is_admin); -- 管理者チェックの高速化
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- 会話関連インデックス
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON public.conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_is_archived ON public.conversations(is_archived);
CREATE INDEX IF NOT EXISTS idx_conversations_user_archived ON public.conversations(user_id, is_archived); -- 複合インデックス追加

-- チャットメッセージ関連インデックス
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON public.chat_messages(role);
CREATE INDEX IF NOT EXISTS idx_chat_messages_type ON public.chat_messages(type);

-- 複合インデックス: 会話IDとタイムスタンプによる検索を最適化
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_created 
ON public.chat_messages(conversation_id, created_at);

-- 複合インデックス: ユーザーIDと会話IDによる検索を最適化
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_conversation 
ON public.chat_messages(user_id, conversation_id);

-- 画像関連インデックス
CREATE INDEX IF NOT EXISTS idx_chat_images_user_id ON public.chat_images(user_id);

-- トレード関連インデックス
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON public.entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_symbol ON public.entries(symbol);
CREATE INDEX IF NOT EXISTS idx_entries_status ON public.entries(status);
CREATE INDEX IF NOT EXISTS idx_entries_time ON public.entries(time);
CREATE INDEX IF NOT EXISTS idx_entries_is_public ON public.entries(is_public);

-- 複合インデックス: ユーザーIDとシンボルによる検索を最適化
CREATE INDEX IF NOT EXISTS idx_entries_user_symbol 
ON public.entries(user_id, symbol);

-- 複合インデックス: ユーザーIDとステータスによる検索を最適化
CREATE INDEX IF NOT EXISTS idx_entries_user_status 
ON public.entries(user_id, status);

-- トレード戦略関連インデックス
CREATE INDEX IF NOT EXISTS idx_trading_strategies_user_id ON public.trading_strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_strategies_is_active ON public.trading_strategies(is_active);

-- 取引履歴関連インデックス
CREATE INDEX IF NOT EXISTS idx_trading_history_user_id ON public.trading_history(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_history_strategy_id ON public.trading_history(strategy_id);
CREATE INDEX IF NOT EXISTS idx_trading_history_symbol ON public.trading_history(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_history_timestamp ON public.trading_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_trading_history_status ON public.trading_history(status);

-- 複合インデックス: ユーザーIDとシンボルによる検索を最適化
CREATE INDEX IF NOT EXISTS idx_trading_history_user_symbol 
ON public.trading_history(user_id, symbol);

-- 複合インデックス: ユーザーIDと戦略IDによる検索を最適化
CREATE INDEX IF NOT EXISTS idx_trading_history_user_strategy 
ON public.trading_history(user_id, strategy_id);

-- 設定関連インデックス
CREATE INDEX IF NOT EXISTS idx_symbol_settings_user_id ON public.symbol_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_symbol_settings_symbol ON public.symbol_settings(symbol);
CREATE INDEX IF NOT EXISTS idx_chart_settings_user_id ON public.chart_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_indicator_settings_user_id ON public.indicator_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_indicator_settings_chart_settings_id ON public.indicator_settings(chart_settings_id);

-- キャッシュデータ関連インデックス
CREATE INDEX IF NOT EXISTS idx_cached_data_data_type ON public.cached_data(data_type);
CREATE INDEX IF NOT EXISTS idx_cached_data_symbol ON public.cached_data(symbol);
CREATE INDEX IF NOT EXISTS idx_cached_data_expires_at ON public.cached_data(expires_at);

-- 複合インデックス: データタイプとシンボルによる検索を最適化
CREATE INDEX IF NOT EXISTS idx_cached_data_type_symbol 
ON public.cached_data(data_type, symbol);

-- ユーザー関係インデックス
CREATE INDEX IF NOT EXISTS idx_user_relations_follower_id ON public.user_relations(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_relations_following_id ON public.user_relations(following_id);

-- バックテストデータインデックス
CREATE INDEX IF NOT EXISTS idx_backtest_data_user_id ON public.backtest_data(user_id);
CREATE INDEX IF NOT EXISTS idx_backtest_data_symbol ON public.backtest_data(symbol);
CREATE INDEX IF NOT EXISTS idx_backtest_data_timeframe ON public.backtest_data(timeframe);

-- メモリ関連インデックス
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON public.memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_external_id ON public.memories(external_id);

-- ベクトル検索のためのインデックス（パラメータ調整）
-- lists=100から200に増加し、より効率的な検索を実現
CREATE INDEX IF NOT EXISTS idx_memories_embedding ON public.memories USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 200); 