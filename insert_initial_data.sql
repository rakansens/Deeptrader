-- 管理者ユーザーの作成（既に存在する場合は更新）
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

-- ストレージバケットの作成（手動で作成）
-- このSQLはコマンドラインで実行する必要があります 