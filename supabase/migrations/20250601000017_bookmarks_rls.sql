-- 📚 ブックマーク管理システムRLSポリシー設定
-- 作成日: 2025/1/25
-- 目的: ブックマークテーブルのセキュリティ設定

-- ブックマークカテゴリテーブルのRLS有効化
ALTER TABLE public.bookmark_categories ENABLE ROW LEVEL SECURITY;

-- デフォルトカテゴリは全ユーザーが読み取り可能
CREATE POLICY "デフォルトカテゴリは全ユーザーが読み取り可能" ON public.bookmark_categories
  FOR SELECT USING (is_default = true);

-- ユーザーは自分のカスタムカテゴリを管理可能
CREATE POLICY "ユーザーは自分のカスタムカテゴリを管理可能" ON public.bookmark_categories
  FOR ALL USING (is_default = false AND auth.uid() IN (SELECT id FROM public.admin_users))
  WITH CHECK (is_default = false AND auth.uid() IN (SELECT id FROM public.admin_users));

-- ブックマークメインテーブルのRLS有効化
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のブックマークのみアクセス可能
CREATE POLICY "ユーザーは自分のブックマークのみアクセス可能" ON public.bookmarks
  FOR ALL USING (auth.uid() = user_id);

-- 管理者はすべてのブックマークにアクセス可能
CREATE POLICY "管理者はすべてのブックマークにアクセス可能" ON public.bookmarks
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.admin_users));

-- ブックマークタグテーブルのRLS有効化
ALTER TABLE public.bookmark_tags ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のブックマークのタグのみアクセス可能
CREATE POLICY "ユーザーは自分のブックマークのタグのみアクセス可能" ON public.bookmark_tags
  FOR ALL USING (
    bookmark_id IN (
      SELECT id FROM public.bookmarks WHERE user_id = auth.uid()
    )
  );

-- 管理者はすべてのブックマークタグにアクセス可能
CREATE POLICY "管理者はすべてのブックマークタグにアクセス可能" ON public.bookmark_tags
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.admin_users));

-- リアルタイム購読設定
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmarks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmark_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmark_tags; 