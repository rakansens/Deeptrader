-- 🎯 通知システムテーブル追加
-- 作成日: 2025/1/25
-- 目的: アプリ内通知・リアルタイム通知の管理

-- ✅ 通知管理テーブル
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'trade_alert', 'system')),
  priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5), -- 1:低 5:高
  data JSONB, -- 追加データ（取引情報等）
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- 期限切れ通知の自動削除用
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス追加（高速検索用）
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_user_priority ON public.notifications(user_id, priority DESC);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_expires ON public.notifications(expires_at) WHERE expires_at IS NOT NULL;

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    -- 既読時刻の自動設定
    IF NEW.is_read = true AND OLD.is_read = false THEN
        NEW.read_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- 期限切れ通知の自動削除関数
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
    -- 期限切れ通知を削除
    DELETE FROM public.notifications 
    WHERE expires_at IS NOT NULL 
      AND expires_at < NOW();
      
    -- 古い既読通知を削除（30日以上）
    DELETE FROM public.notifications 
    WHERE is_read = true 
      AND is_dismissed = true
      AND updated_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 通知統計取得関数
CREATE OR REPLACE FUNCTION get_notification_stats(target_user_id UUID)
RETURNS TABLE(
    total_count BIGINT,
    unread_count BIGINT,
    priority_high_count BIGINT,
    latest_notification_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE is_read = false) as unread_count,
        COUNT(*) FILTER (WHERE is_read = false AND priority >= 4) as priority_high_count,
        (SELECT id FROM public.notifications 
         WHERE user_id = target_user_id 
           AND is_read = false 
         ORDER BY created_at DESC 
         LIMIT 1) as latest_notification_id
    FROM public.notifications 
    WHERE user_id = target_user_id 
      AND is_dismissed = false;
END;
$$ LANGUAGE plpgsql; 