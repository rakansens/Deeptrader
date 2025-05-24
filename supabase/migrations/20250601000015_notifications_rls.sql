-- 🎯 通知システムテーブルRLSポリシー追加
-- 作成日: 2025/1/25
-- 目的: notificationsテーブルのセキュリティ設定

-- 通知テーブルのRLS有効化
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の通知のみアクセス可能
CREATE POLICY "ユーザーは自分の通知のみアクセス可能" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- 管理者はすべての通知にアクセス可能
CREATE POLICY "管理者はすべての通知にアクセス可能" ON public.notifications
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.admin_users));

-- システム通知作成用（アプリケーション側から）
CREATE POLICY "システム通知作成" ON public.notifications
  FOR INSERT WITH CHECK (type IN ('system', 'trade_alert', 'info'));

-- リアルタイム購読設定
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; 