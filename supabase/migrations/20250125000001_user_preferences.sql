-- 🎯 ユーザー設定拡張テーブル追加
-- 作成日: 2025/1/25
-- 目的: 音声・テーマ・チャート設定等の詳細なユーザー設定管理

-- migrate:up

-- ✅ ユーザー設定テーブル（カテゴリ別管理）
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('audio', 'theme', 'chart', 'notifications', 'trading')),
  preference_key TEXT NOT NULL,
  preference_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 同一ユーザー・カテゴリ・キーの組み合わせを一意制約
  UNIQUE(user_id, category, preference_key)
);

-- インデックス追加（高速検索用）
CREATE INDEX idx_user_preferences_user_category ON public.user_preferences(user_id, category);
CREATE INDEX idx_user_preferences_key ON public.user_preferences(preference_key);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- サンプルデータ挿入（開発・テスト用）
-- 注意: user_idは実際の値に置き換える必要があります

-- 音声設定
INSERT INTO public.user_preferences (user_id, category, preference_key, preference_value) VALUES
  ('00000000-0000-0000-0000-000000000001', 'audio', 'voice_enabled', '"true"'::jsonb),
  ('00000000-0000-0000-0000-000000000001', 'audio', 'alert_sound', '"chime"'::jsonb),
  ('00000000-0000-0000-0000-000000000001', 'audio', 'volume_level', '0.8'::jsonb);

-- テーマ設定
INSERT INTO public.user_preferences (user_id, category, preference_key, preference_value) VALUES
  ('00000000-0000-0000-0000-000000000001', 'theme', 'color_scheme', '"dark"'::jsonb),
  ('00000000-0000-0000-0000-000000000001', 'theme', 'accent_color', '"blue"'::jsonb),
  ('00000000-0000-0000-0000-000000000001', 'theme', 'sidebar_collapsed', 'false'::jsonb);

-- チャート設定
INSERT INTO public.user_preferences (user_id, category, preference_key, preference_value) VALUES
  ('00000000-0000-0000-0000-000000000001', 'chart', 'default_timeframe', '"1h"'::jsonb),
  ('00000000-0000-0000-0000-000000000001', 'chart', 'show_volume', 'true'::jsonb),
  ('00000000-0000-0000-0000-000000000001', 'chart', 'chart_style', '"candlestick"'::jsonb);

-- 通知設定
INSERT INTO public.user_preferences (user_id, category, preference_key, preference_value) VALUES
  ('00000000-0000-0000-0000-000000000001', 'notifications', 'trade_alerts', 'true'::jsonb),
  ('00000000-0000-0000-0000-000000000001', 'notifications', 'price_alerts', 'true'::jsonb),
  ('00000000-0000-0000-0000-000000000001', 'notifications', 'system_alerts', 'false'::jsonb);

-- トレーディング設定
INSERT INTO public.user_preferences (user_id, category, preference_key, preference_value) VALUES
  ('00000000-0000-0000-0000-000000000001', 'trading', 'default_quantity', '1.0'::jsonb),
  ('00000000-0000-0000-0000-000000000001', 'trading', 'risk_level', '"medium"'::jsonb),
  ('00000000-0000-0000-0000-000000000001', 'trading', 'auto_stop_loss', 'true'::jsonb);

-- migrate:down
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP INDEX IF EXISTS idx_user_preferences_key;
DROP INDEX IF EXISTS idx_user_preferences_user_category;
DROP TABLE IF EXISTS public.user_preferences; 