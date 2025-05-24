-- 🎯 ユーザー設定テーブルRLSポリシー追加
-- 作成日: 2025/1/25
-- 目的: user_preferencesテーブルのセキュリティ設定

-- ユーザー設定テーブルのRLS有効化
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の設定のみアクセス可能
CREATE POLICY "ユーザーは自分の設定のみアクセス可能" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- 管理者はすべての設定にアクセス可能
CREATE POLICY "管理者はすべての設定にアクセス可能" ON public.user_preferences
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.admin_users));