-- migrate:up
-- 06_initial_data.sql
-- 初期データを挿入するスクリプト
-- 作成日: 2025/5/20
-- 更新内容: 修正版、初期データ挿入処理を修正し、ユーザー作成後に動作するよう調整

/*
このスクリプトは初期データをデータベースに挿入します。
主な内容:
- 管理者ユーザーの作成
- デフォルトのチャート設定
- デフォルトのシンボル設定
- ストレージバケットの作成
*/

-- トランザクション開始
BEGIN;

-- 管理者ユーザーの作成（既に存在する場合は更新）
-- 注意: UUIDはユーザー固有のものを使用します。ここでは簡単のため決め打ちしています。
INSERT INTO users (id, email, full_name, is_admin)
VALUES 
  ('396c7505-4679-4440-8c95-a4c9fe62c2ca', 'rakansens@gmail.com', 'Administrator', true)
ON CONFLICT (id) DO UPDATE 
SET 
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  is_admin = EXCLUDED.is_admin;

-- 管理者プロフィールの作成
INSERT INTO profiles (user_id, username, display_name)
VALUES 
  ('396c7505-4679-4440-8c95-a4c9fe62c2ca', 'admin', 'Administrator')
ON CONFLICT (user_id) DO NOTHING;

-- トランザクション終了
COMMIT;

-- デフォルトのシンボル設定を作成
BEGIN;

-- デフォルトのシンボル設定
INSERT INTO symbol_settings (user_id, symbol, is_favorite, display_order)
VALUES
  ('396c7505-4679-4440-8c95-a4c9fe62c2ca', 'BTCUSDT', true, 1),
  ('396c7505-4679-4440-8c95-a4c9fe62c2ca', 'ETHUSDT', true, 2),
  ('396c7505-4679-4440-8c95-a4c9fe62c2ca', 'SOLUSDT', true, 3),
  ('396c7505-4679-4440-8c95-a4c9fe62c2ca', 'BNBUSDT', false, 4),
  ('396c7505-4679-4440-8c95-a4c9fe62c2ca', 'ADAUSDT', false, 5)
ON CONFLICT (user_id, symbol) DO UPDATE
SET
  is_favorite = EXCLUDED.is_favorite,
  display_order = EXCLUDED.display_order;

-- デフォルトのチャート設定
INSERT INTO chart_settings (user_id, timeframe, chart_type)
VALUES
  ('396c7505-4679-4440-8c95-a4c9fe62c2ca', '1h', 'candlestick')
ON CONFLICT DO NOTHING;

-- トランザクション終了
COMMIT;

-- ストレージバケットの作成（Supabaseが管理するテーブルへの挿入）
BEGIN;

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- 注意: 初期データの挿入は既存のデータと競合する可能性があります。
-- ON CONFLICT句を使用して適切に処理してください。
-- migrate:down
-- 注意: このスクリプトを実行すると、すべてのデータが失われます。
-- 実行前に必ずバックアップを取得してください.
