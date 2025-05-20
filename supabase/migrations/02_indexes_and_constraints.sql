-- 02_indexes_and_constraints.sql
-- インデックスと制約を追加するスクリプト
-- 作成日: 2025/5/20
-- 更新内容: 初期作成、インデックスの最適化、ベクトルインデックスのパラメータ調整

/*
このスクリプトはインデックスと制約を追加し、データベースのパフォーマンスと整合性を向上させます。
主な変更点:
- クエリパターンに基づく適切なインデックスの追加
- 外部キー制約の完全性確保
- ベクトルインデックスのパラメータを調整（lists=100→200に増加、効率化）
- 複合インデックスの追加による検索パフォーマンスの向上
*/

-- トランザクション開始
BEGIN;

-- ユーザー関連インデックス
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin); -- 管理者チェックの高速化
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- 会話関連インデックス
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_is_archived ON conversations(is_archived);
CREATE INDEX IF NOT EXISTS idx_conversations_user_archived ON conversations(user_id, is_archived); -- 複合インデックス追加

-- チャットメッセージ関連インデックス
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON chat_messages(role);
CREATE INDEX IF NOT EXISTS idx_chat_messages_type ON chat_messages(type);

-- 複合インデックス: 会話IDとタイムスタンプによる検索を最適化
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_created 
ON chat_messages(conversation_id, created_at);

-- 複合インデックス: ユーザーIDと会話IDによる検索を最適化
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_conversation 
ON chat_messages(user_id, conversation_id);

-- 画像関連インデックス
CREATE INDEX IF NOT EXISTS idx_chat_images_user_id ON chat_images(user_id);

-- トレード関連インデックス
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_symbol ON entries(symbol);
CREATE INDEX IF NOT EXISTS idx_entries_status ON entries(status);
CREATE INDEX IF NOT EXISTS idx_entries_time ON entries(time);
CREATE INDEX IF NOT EXISTS idx_entries_is_public ON entries(is_public);

-- 複合インデックス: ユーザーIDとシンボルによる検索を最適化
CREATE INDEX IF NOT EXISTS idx_entries_user_symbol 
ON entries(user_id, symbol);

-- 複合インデックス: ユーザーIDとステータスによる検索を最適化
CREATE INDEX IF NOT EXISTS idx_entries_user_status 
ON entries(user_id, status);

-- トレード戦略関連インデックス
CREATE INDEX IF NOT EXISTS idx_trading_strategies_user_id ON trading_strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_strategies_is_active ON trading_strategies(is_active);

-- 取引履歴関連インデックス
CREATE INDEX IF NOT EXISTS idx_trading_history_user_id ON trading_history(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_history_strategy_id ON trading_history(strategy_id);
CREATE INDEX IF NOT EXISTS idx_trading_history_symbol ON trading_history(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_history_timestamp ON trading_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_trading_history_status ON trading_history(status);

-- 複合インデックス: ユーザーIDとシンボルによる検索を最適化
CREATE INDEX IF NOT EXISTS idx_trading_history_user_symbol 
ON trading_history(user_id, symbol);

-- 複合インデックス: ユーザーIDと戦略IDによる検索を最適化
CREATE INDEX IF NOT EXISTS idx_trading_history_user_strategy 
ON trading_history(user_id, strategy_id);

-- 設定関連インデックス
CREATE INDEX IF NOT EXISTS idx_symbol_settings_user_id ON symbol_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_symbol_settings_symbol ON symbol_settings(symbol);
CREATE INDEX IF NOT EXISTS idx_chart_settings_user_id ON chart_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_indicator_settings_user_id ON indicator_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_indicator_settings_chart_settings_id ON indicator_settings(chart_settings_id);

-- キャッシュデータ関連インデックス
CREATE INDEX IF NOT EXISTS idx_cached_data_data_type ON cached_data(data_type);
CREATE INDEX IF NOT EXISTS idx_cached_data_symbol ON cached_data(symbol);
CREATE INDEX IF NOT EXISTS idx_cached_data_expires_at ON cached_data(expires_at);

-- 複合インデックス: データタイプとシンボルによる検索を最適化
CREATE INDEX IF NOT EXISTS idx_cached_data_type_symbol 
ON cached_data(data_type, symbol);

-- ユーザー関係インデックス
CREATE INDEX IF NOT EXISTS idx_user_relations_follower_id ON user_relations(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_relations_following_id ON user_relations(following_id);

-- バックテストデータインデックス
CREATE INDEX IF NOT EXISTS idx_backtest_data_user_id ON backtest_data(user_id);
CREATE INDEX IF NOT EXISTS idx_backtest_data_symbol ON backtest_data(symbol);
CREATE INDEX IF NOT EXISTS idx_backtest_data_timeframe ON backtest_data(timeframe);

-- メモリ関連インデックス
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_external_id ON memories(external_id);

-- ベクトル検索のためのインデックス（パラメータ調整）
-- lists=100から200に増加し、より効率的な検索を実現
CREATE INDEX IF NOT EXISTS idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 200);

-- ストレージ関連インデックス
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_id ON storage.objects(bucket_id);
CREATE INDEX IF NOT EXISTS idx_storage_objects_name ON storage.objects(name);
CREATE INDEX IF NOT EXISTS idx_storage_objects_owner ON storage.objects(owner);
CREATE INDEX IF NOT EXISTS idx_storage_objects_path ON storage.objects(path);

-- トランザクション終了
COMMIT;

-- 注意: インデックスの作成はテーブルのサイズによっては時間がかかる場合があります。
-- 大規模なデータベースでは、オフピーク時に実行することをお勧めします。