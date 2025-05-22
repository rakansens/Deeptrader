-- migrate:up
-- RLSポリシー定義
-- 作成日: 2025/6/1
-- 更新内容: 全テーブルのRLSポリシー定義

-- ユーザーテーブルのRLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみ読み取り可能
CREATE POLICY "ユーザーは自分のデータのみ読み取り可能" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- ユーザーは自分のデータのみ更新可能
CREATE POLICY "ユーザーは自分のデータのみ更新可能" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 管理者はすべてのユーザーデータにアクセス可能（最適化版）
CREATE POLICY "管理者はすべてのユーザーデータにアクセス可能" ON public.users
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.admin_users));

-- プロフィールテーブルのRLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のプロフィールのみ読み取り可能
CREATE POLICY "ユーザーは自分のプロフィールのみ読み取り可能" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

-- ユーザーは自分のプロフィールのみ更新可能
CREATE POLICY "ユーザーは自分のプロフィールのみ更新可能" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- ユーザーは自分のプロフィールのみ削除可能
CREATE POLICY "ユーザーは自分のプロフィールのみ削除可能" ON public.profiles
  FOR DELETE USING (auth.uid() = user_id);

-- ユーザーは自分のプロフィールのみ挿入可能
CREATE POLICY "ユーザーは自分のプロフィールのみ挿入可能" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 管理者はすべてのプロフィールデータにアクセス可能（最適化版）
CREATE POLICY "管理者はすべてのプロフィールデータにアクセス可能" ON public.profiles
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.admin_users));

-- 会話テーブルのRLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の会話のみアクセス可能
CREATE POLICY "ユーザーは自分の会話のみアクセス可能" ON public.conversations
  FOR ALL USING (auth.uid() = user_id);

-- 管理者はすべての会話にアクセス可能（最適化版）
CREATE POLICY "管理者はすべての会話にアクセス可能" ON public.conversations
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.admin_users));

-- チャットメッセージテーブルのRLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のメッセージのみアクセス可能
CREATE POLICY "ユーザーは自分のメッセージのみアクセス可能" ON public.chat_messages
  FOR ALL USING (auth.uid() = user_id);

-- 公開メッセージは誰でも読み取り可能
CREATE POLICY "公開メッセージは誰でも読み取り可能" ON public.chat_messages
  FOR SELECT USING (is_public = true);

-- 管理者はすべてのメッセージにアクセス可能（最適化版）
CREATE POLICY "管理者はすべてのメッセージにアクセス可能" ON public.chat_messages
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.admin_users));

-- チャット画像テーブルのRLS
ALTER TABLE public.chat_images ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の画像のみアクセス可能
CREATE POLICY "ユーザーは自分の画像のみアクセス可能" ON public.chat_images
  FOR ALL USING (auth.uid() = user_id);

-- 管理者はすべての画像にアクセス可能（最適化版）
CREATE POLICY "管理者はすべての画像にアクセス可能" ON public.chat_images
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.admin_users));

-- パブリック設定されている画像は誰でも参照可能
CREATE POLICY "パブリック設定されている画像は誰でも参照可能" ON public.chat_images
  FOR SELECT USING (is_public = true);

-- エントリーテーブルのRLS
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のエントリーのみアクセス可能
CREATE POLICY "ユーザーは自分のエントリーのみアクセス可能" ON public.entries
  FOR ALL USING (auth.uid() = user_id);

-- 公開エントリーは誰でも読み取り可能
CREATE POLICY "公開エントリーは誰でも読み取り可能" ON public.entries
  FOR SELECT USING (is_public = true);

-- 管理者はすべてのエントリーにアクセス可能（最適化版）
CREATE POLICY "管理者はすべてのエントリーにアクセス可能" ON public.entries
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.admin_users));

-- トレード戦略テーブルのRLS
ALTER TABLE public.trading_strategies ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の戦略のみアクセス可能
CREATE POLICY "ユーザーは自分の戦略のみアクセス可能" ON public.trading_strategies
  FOR ALL USING (auth.uid() = user_id);

-- 管理者はすべての戦略にアクセス可能（最適化版）
CREATE POLICY "管理者はすべての戦略にアクセス可能" ON public.trading_strategies
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.admin_users));

-- 取引履歴テーブルのRLS
ALTER TABLE public.trading_history ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の取引履歴のみアクセス可能
CREATE POLICY "ユーザーは自分の取引履歴のみアクセス可能" ON public.trading_history
  FOR ALL USING (auth.uid() = user_id);

-- 管理者はすべての取引履歴にアクセス可能（最適化版）
CREATE POLICY "管理者はすべての取引履歴にアクセス可能" ON public.trading_history
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.admin_users));

-- シンボル設定テーブルのRLS
ALTER TABLE public.symbol_settings ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のシンボル設定のみアクセス可能
CREATE POLICY "ユーザーは自分のシンボル設定のみアクセス可能" ON public.symbol_settings
  FOR ALL USING (auth.uid() = user_id);

-- 管理者はすべてのシンボル設定にアクセス可能（最適化版）
CREATE POLICY "管理者はすべてのシンボル設定にアクセス可能" ON public.symbol_settings
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.admin_users));

-- チャート設定テーブルのRLS
ALTER TABLE public.chart_settings ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のチャート設定のみアクセス可能
CREATE POLICY "ユーザーは自分のチャート設定のみアクセス可能" ON public.chart_settings
  FOR ALL USING (auth.uid() = user_id);

-- 管理者はすべてのチャート設定にアクセス可能（最適化版）
CREATE POLICY "管理者はすべてのチャート設定にアクセス可能" ON public.chart_settings
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.admin_users));

-- インジケーター設定テーブルのRLS
ALTER TABLE public.indicator_settings ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のインジケーター設定のみアクセス可能
CREATE POLICY "ユーザーは自分のインジケーター設定のみアクセス可能" ON public.indicator_settings
  FOR ALL USING (auth.uid() = user_id);

-- 管理者はすべてのインジケーター設定にアクセス可能（最適化版）
CREATE POLICY "管理者はすべてのインジケーター設定にアクセス可能" ON public.indicator_settings
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.admin_users));

-- キャッシュデータテーブルのRLS
ALTER TABLE public.cached_data ENABLE ROW LEVEL SECURITY;

-- すべてのユーザーがキャッシュデータを読み取り可能
CREATE POLICY "すべてのユーザーがキャッシュデータを読み取り可能" ON public.cached_data
  FOR SELECT TO authenticated USING (true);

-- 管理者のみがキャッシュデータを変更可能（最適化版）
CREATE POLICY "管理者のみがキャッシュデータを変更可能" ON public.cached_data
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.admin_users));

-- ユーザー関係テーブルのRLS
ALTER TABLE public.user_relations ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のフォロー関係のみアクセス可能
CREATE POLICY "ユーザーは自分のフォロー関係のみアクセス可能" ON public.user_relations
  FOR ALL USING (auth.uid() = follower_id);

-- ユーザーは自分をフォローしている関係を読み取り可能
CREATE POLICY "ユーザーは自分をフォローしている関係を読み取り可能" ON public.user_relations
  FOR SELECT USING (auth.uid() = following_id);

-- 管理者はすべてのユーザー関係にアクセス可能（最適化版）
CREATE POLICY "管理者はすべてのユーザー関係にアクセス可能" ON public.user_relations
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.admin_users));

-- バックテストデータテーブルのRLS
ALTER TABLE public.backtest_data ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のバックテストデータのみアクセス可能
CREATE POLICY "ユーザーは自分のバックテストデータのみアクセス可能" ON public.backtest_data
  FOR ALL USING (auth.uid() = user_id);

-- 管理者はすべてのバックテストデータにアクセス可能（最適化版）
CREATE POLICY "管理者はすべてのバックテストデータにアクセス可能" ON public.backtest_data
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.admin_users));

-- メモリテーブルのRLS
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のメモリのみアクセス可能
CREATE POLICY "ユーザーは自分のメモリのみアクセス可能" ON public.memories
  FOR ALL USING (auth.uid() = user_id);

-- 管理者はすべてのメモリにアクセス可能（最適化版）
CREATE POLICY "管理者はすべてのメモリにアクセス可能" ON public.memories
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.admin_users));

-- ベクトルメモリーテーブルのRLS
ALTER TABLE public.memories_vector ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のベクトルメモリーのみアクセス可能
CREATE POLICY "ユーザーは自分のベクトルメモリーのみアクセス可能" ON public.memories_vector
  FOR ALL USING (auth.uid() = user_id);

-- 公開ベクトルメモリーは誰でもアクセス可能
CREATE POLICY "公開ベクトルメモリーは誰でもアクセス可能" ON public.memories_vector
  FOR SELECT USING (is_public = true);

-- 管理者はすべてのベクトルメモリーにアクセス可能
CREATE POLICY "管理者はすべてのベクトルメモリーにアクセス可能" ON public.memories_vector
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.admin_users)); 