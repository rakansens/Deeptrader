-- 🎯 ファイル管理テーブルRLSポリシー追加
-- 作成日: 2025/1/25
-- 目的: uploaded_filesテーブルのセキュリティ設定

-- ファイル管理テーブルのRLS有効化
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のファイルのみアクセス可能
CREATE POLICY "ユーザーは自分のファイルのみアクセス可能" ON public.uploaded_files
  FOR ALL USING (auth.uid() = user_id);

-- 管理者はすべてのファイルにアクセス可能
CREATE POLICY "管理者はすべてのファイルにアクセス可能" ON public.uploaded_files
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.admin_users));

-- アバター画像は他のユーザーからも読み取り可能（チャット画面表示用）
CREATE POLICY "アバター画像は読み取り可能" ON public.uploaded_files
  FOR SELECT USING (
    file_type IN ('avatar_user', 'avatar_assistant') 
    AND is_active = true
  ); 