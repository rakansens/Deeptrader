-- 06_initial_data.sql
-- 初期データを挿入するスクリプト
-- 作成日: 2025/5/20
-- 更新内容: 初期作成、初期データの定義

/*
このスクリプトは初期データをデータベースに挿入します。
主な内容:
- 管理者ユーザーの作成
- デフォルトのチャート設定
- デフォルトのシンボル設定
- サンプルデータ
- 長時間実行される操作を別トランザクションに分割
*/

-- トランザクション開始
BEGIN;

-- 管理者ユーザーの作成（既に存在する場合は更新）
INSERT INTO users (id, email, full_name, is_admin)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'admin@deeptrader.com', 'System Administrator', true)
ON CONFLICT (id) DO UPDATE 
SET 
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  is_admin = EXCLUDED.is_admin;

-- 管理者プロフィールの作成
INSERT INTO profiles (user_id, username, display_name)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'admin', 'System Administrator')
ON CONFLICT (user_id) DO NOTHING;

-- トランザクション終了
COMMIT;

-- 長時間実行される可能性のある操作は別トランザクションで実行
-- デフォルトのシンボル設定
BEGIN;
INSERT INTO symbol_settings (user_id, symbol, is_favorite, display_order)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'BTCUSDT', true, 1),
  ('00000000-0000-0000-0000-000000000000', 'ETHUSDT', true, 2),
  ('00000000-0000-0000-0000-000000000000', 'BNBUSDT', true, 3),
  ('00000000-0000-0000-0000-000000000000', 'SOLUSDT', true, 4),
  ('00000000-0000-0000-0000-000000000000', 'ADAUSDT', true, 5)
ON CONFLICT (user_id, symbol) DO UPDATE 
SET 
  is_favorite = EXCLUDED.is_favorite,
  display_order = EXCLUDED.display_order;
COMMIT;

-- デフォルトのチャート設定
BEGIN;
INSERT INTO chart_settings (user_id, timeframe, chart_type, show_volume, show_grid, show_legend, theme)
VALUES
  ('00000000-0000-0000-0000-000000000000', '1h', 'candlestick', true, true, true, 'dark')
ON CONFLICT (id) DO NOTHING;
COMMIT;

-- デフォルトのインジケーター設定
BEGIN;
DO $$
DECLARE
  chart_settings_id UUID;
BEGIN
  -- チャート設定IDを取得
  SELECT id INTO chart_settings_id FROM chart_settings 
  WHERE user_id = '00000000-0000-0000-0000-000000000000' AND timeframe = '1h' LIMIT 1;
  
  -- インジケーター設定を挿入
  IF chart_settings_id IS NOT NULL THEN
    -- RSIインジケーター
    INSERT INTO indicator_settings (user_id, chart_settings_id, type, params, color, visible)
    VALUES
      ('00000000-0000-0000-0000-000000000000', chart_settings_id, 'rsi', '{"period": 14}', '#1E88E5', true)
    ON CONFLICT (id) DO NOTHING;
    
    -- MACDインジケーター
    INSERT INTO indicator_settings (user_id, chart_settings_id, type, params, color, visible)
    VALUES
      ('00000000-0000-0000-0000-000000000000', chart_settings_id, 'macd', '{"fastPeriod": 12, "slowPeriod": 26, "signalPeriod": 9}', '#43A047', true)
    ON CONFLICT (id) DO NOTHING;
    
    -- ボリンジャーバンド
    INSERT INTO indicator_settings (user_id, chart_settings_id, type, params, color, visible)
    VALUES
      ('00000000-0000-0000-0000-000000000000', chart_settings_id, 'bollinger', '{"period": 20, "stdDev": 2}', '#FFA000', true)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END
$$;
COMMIT;

-- サンプル会話とメッセージ
BEGIN;
-- サンプル会話
INSERT INTO conversations (id, user_id, title, system_prompt)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'サンプル会話', 'あなたはDeeptraderのAIアシスタントです。トレーダーの質問に答え、市場分析を提供します。')
ON CONFLICT (id) DO NOTHING;

-- サンプルメッセージ
INSERT INTO chat_messages (conversation_id, user_id, role, content, type)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'user', 'こんにちは、ビットコインの分析をお願いします。', 'text'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'assistant', 'こんにちは！ビットコインの現在の状況を分析します。まず、チャートパターンを確認しましょう...', 'text')
ON CONFLICT (id) DO NOTHING;
COMMIT;

-- サンプルトレード戦略
BEGIN;
INSERT INTO trading_strategies (user_id, name, description, is_active, config)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'RSIクロスオーバー戦略', 'RSIが30を下回ったら買い、70を上回ったら売る単純な戦略', true, '{"indicator": "rsi", "buyThreshold": 30, "sellThreshold": 70}')
ON CONFLICT (id) DO NOTHING;
COMMIT;

-- ストレージバケットの作成
BEGIN;
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;
COMMIT;

-- 注意: 初期データの挿入は既存のデータと競合する可能性があります。
-- ON CONFLICT句を使用して適切に処理してください。