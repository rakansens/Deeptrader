-- 05_rls_policies.sql
-- RLSポリシー定義
-- 作成日: 2025/5/20
-- 更新内容: 初期作成、全テーブルのRLSポリシー定義

/*
このスクリプトはRow Level Security (RLS)ポリシーを定義し、データのセキュリティを確保します。
主な内容:
- 各テーブルに対するRLSの有効化
- ユーザーが自分のデータのみにアクセスできるようにするポリシーの設定
- 管理者に対する特別なアクセス権限の付与
- 公開データに対する読み取りアクセスの設定
- 最適化された管理者チェック（admin_usersビューを使用）
*/

-- トランザクション開始
BEGIN;

-- ユーザーテーブルのRLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみ読み取り可能
CREATE POLICY "ユーザーは自分のデータのみ読み取り可能" ON users
  FOR SELECT USING (auth.uid() = id);

-- ユーザーは自分のデータのみ更新可能
CREATE POLICY "ユーザーは自分のデータのみ更新可能" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 管理者はすべてのユーザーデータにアクセス可能（最適化版）
CREATE POLICY "管理者はすべてのユーザーデータにアクセス可能" ON users
  FOR ALL USING (auth.uid() IN (SELECT id FROM admin_users));

-- プロフィールテーブルのRLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のプロフィールのみ読み取り可能
CREATE POLICY "ユーザーは自分のプロフィールのみ読み取り可能" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

-- ユーザーは自分のプロフィールのみ更新可能
CREATE POLICY "ユーザーは自分のプロフィールのみ更新可能" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- ユーザーは自分のプロフィールのみ削除可能
CREATE POLICY "ユーザーは自分のプロフィールのみ削除可能" ON profiles
  FOR DELETE USING (auth.uid() = user_id);

-- ユーザーは自分のプロフィールのみ挿入可能
CREATE POLICY "ユーザーは自分のプロフィールのみ挿入可能" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 管理者はすべてのプロフィールデータにアクセス可能（最適化版）
CREATE POLICY "管理者はすべてのプロフィールデータにアクセス可能" ON profiles
  FOR ALL USING (auth.uid() IN (SELECT id FROM admin_users));

-- 会話テーブルのRLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の会話のみアクセス可能
CREATE POLICY "ユーザーは自分の会話のみアクセス可能" ON conversations
  FOR ALL USING (auth.uid() = user_id);

-- 管理者はすべての会話にアクセス可能（最適化版）
CREATE POLICY "管理者はすべての会話にアクセス可能" ON conversations
  FOR ALL USING (auth.uid() IN (SELECT id FROM admin_users));

-- チャットメッセージテーブルのRLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のメッセージのみアクセス可能
CREATE POLICY "ユーザーは自分のメッセージのみアクセス可能" ON chat_messages
  FOR ALL USING (auth.uid() = user_id);

-- 公開メッセージは誰でも読み取り可能
CREATE POLICY "公開メッセージは誰でも読み取り可能" ON chat_messages
  FOR SELECT USING (is_public = true);

-- 管理者はすべてのメッセージにアクセス可能（最適化版）
CREATE POLICY "管理者はすべてのメッセージにアクセス可能" ON chat_messages
  FOR ALL USING (auth.uid() IN (SELECT id FROM admin_users));

-- チャット画像テーブルのRLS
ALTER TABLE chat_images ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の画像のみアクセス可能
CREATE POLICY "ユーザーは自分の画像のみアクセス可能" ON chat_images
  FOR ALL USING (auth.uid() = user_id);

-- 管理者はすべての画像にアクセス可能（最適化版）
CREATE POLICY "管理者はすべての画像にアクセス可能" ON chat_images
  FOR ALL USING (auth.uid() IN (SELECT id FROM admin_users));

-- エントリーテーブルのRLS
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のエントリーのみアクセス可能
CREATE POLICY "ユーザーは自分のエントリーのみアクセス可能" ON entries
  FOR ALL USING (auth.uid() = user_id);

-- 公開エントリーは誰でも読み取り可能
CREATE POLICY "公開エントリーは誰でも読み取り可能" ON entries
  FOR SELECT USING (is_public = true);

-- 管理者はすべてのエントリーにアクセス可能（最適化版）
CREATE POLICY "管理者はすべてのエントリーにアクセス可能" ON entries
  FOR ALL USING (auth.uid() IN (SELECT id FROM admin_users));

-- トレード戦略テーブルのRLS
ALTER TABLE trading_strategies ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の戦略のみアクセス可能
CREATE POLICY "ユーザーは自分の戦略のみアクセス可能" ON trading_strategies
  FOR ALL USING (auth.uid() = user_id);

-- 管理者はすべての戦略にアクセス可能（最適化版）
CREATE POLICY "管理者はすべての戦略にアクセス可能" ON trading_strategies
  FOR ALL USING (auth.uid() IN (SELECT id FROM admin_users));

-- 取引履歴テーブルのRLS
ALTER TABLE trading_history ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の取引履歴のみアクセス可能
CREATE POLICY "ユーザーは自分の取引履歴のみアクセス可能" ON trading_history
  FOR ALL USING (auth.uid() = user_id);

-- 管理者はすべての取引履歴にアクセス可能（最適化版）
CREATE POLICY "管理者はすべての取引履歴にアクセス可能" ON trading_history
  FOR ALL USING (auth.uid() IN (SELECT id FROM admin_users));

-- シンボル設定テーブルのRLS
ALTER TABLE symbol_settings ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のシンボル設定のみアクセス可能
CREATE POLICY "ユーザーは自分のシンボル設定のみアクセス可能" ON symbol_settings
  FOR ALL USING (auth.uid() = user_id);

-- 管理者はすべてのシンボル設定にアクセス可能（最適化版）
CREATE POLICY "管理者はすべてのシンボル設定にアクセス可能" ON symbol_settings
  FOR ALL USING (auth.uid() IN (SELECT id FROM admin_users));

-- チャート設定テーブルのRLS
ALTER TABLE chart_settings ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のチャート設定のみアクセス可能
CREATE POLICY "ユーザーは自分のチャート設定のみアクセス可能" ON chart_settings
  FOR ALL USING (auth.uid() = user_id);

-- 管理者はすべてのチャート設定にアクセス可能（最適化版）
CREATE POLICY "管理者はすべてのチャート設定にアクセス可能" ON chart_settings
  FOR ALL USING (auth.uid() IN (SELECT id FROM admin_users));

-- インジケーター設定テーブルのRLS
ALTER TABLE indicator_settings ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のインジケーター設定のみアクセス可能
CREATE POLICY "ユーザーは自分のインジケーター設定のみアクセス可能" ON indicator_settings
  FOR ALL USING (auth.uid() = user_id);

-- 管理者はすべてのインジケーター設定にアクセス可能（最適化版）
CREATE POLICY "管理者はすべてのインジケーター設定にアクセス可能" ON indicator_settings
  FOR ALL USING (auth.uid() IN (SELECT id FROM admin_users));

-- キャッシュデータテーブルのRLS
ALTER TABLE cached_data ENABLE ROW LEVEL SECURITY;

-- すべてのユーザーがキャッシュデータを読み取り可能
CREATE POLICY "すべてのユーザーがキャッシュデータを読み取り可能" ON cached_data
  FOR SELECT TO authenticated USING (true);

-- 管理者のみがキャッシュデータを変更可能（最適化版）
CREATE POLICY "管理者のみがキャッシュデータを変更可能" ON cached_data
  FOR ALL USING (auth.uid() IN (SELECT id FROM admin_users));

-- ユーザー関係テーブルのRLS
ALTER TABLE user_relations ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のフォロー関係のみアクセス可能
CREATE POLICY "ユーザーは自分のフォロー関係のみアクセス可能" ON user_relations
  FOR ALL USING (auth.uid() = follower_id);

-- ユーザーは自分をフォローしている関係を読み取り可能
CREATE POLICY "ユーザーは自分をフォローしている関係を読み取り可能" ON user_relations
  FOR SELECT USING (auth.uid() = following_id);

-- 管理者はすべてのユーザー関係にアクセス可能（最適化版）
CREATE POLICY "管理者はすべてのユーザー関係にアクセス可能" ON user_relations
  FOR ALL USING (auth.uid() IN (SELECT id FROM admin_users));

-- バックテストデータテーブルのRLS
ALTER TABLE backtest_data ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のバックテストデータのみアクセス可能
CREATE POLICY "ユーザーは自分のバックテストデータのみアクセス可能" ON backtest_data
  FOR ALL USING (auth.uid() = user_id);

-- 管理者はすべてのバックテストデータにアクセス可能（最適化版）
CREATE POLICY "管理者はすべてのバックテストデータにアクセス可能" ON backtest_data
  FOR ALL USING (auth.uid() IN (SELECT id FROM admin_users));

-- メモリテーブルのRLS
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のメモリのみアクセス可能
CREATE POLICY "ユーザーは自分のメモリのみアクセス可能" ON memories
  FOR ALL USING (auth.uid() = user_id);

-- 管理者はすべてのメモリにアクセス可能（最適化版）
CREATE POLICY "管理者はすべてのメモリにアクセス可能" ON memories
  FOR ALL USING (auth.uid() IN (SELECT id FROM admin_users));

-- ストレージバケットのRLS
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは公開バケットを読み取り可能
CREATE POLICY "認証済みユーザーは公開バケットを読み取り可能" ON storage.buckets
  FOR SELECT TO authenticated USING (public = true);

-- 管理者はすべてのバケットにアクセス可能（最適化版）
CREATE POLICY "管理者はすべてのバケットにアクセス可能" ON storage.buckets
  FOR ALL USING (auth.uid() IN (SELECT id FROM admin_users));

-- ストレージオブジェクトのRLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のオブジェクトのみアクセス可能
CREATE POLICY "ユーザーは自分のオブジェクトのみアクセス可能" ON storage.objects
  FOR ALL USING (auth.uid() = owner);

-- 認証済みユーザーは公開バケット内のオブジェクトを読み取り可能
CREATE POLICY "認証済みユーザーは公開バケット内のオブジェクトを読み取り可能" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id IN (SELECT id FROM storage.buckets WHERE public = true)
  );

-- 管理者はすべてのオブジェクトにアクセス可能（最適化版）
CREATE POLICY "管理者はすべてのオブジェクトにアクセス可能" ON storage.objects
  FOR ALL USING (auth.uid() IN (SELECT id FROM admin_users));

-- トランザクション終了
COMMIT;

-- 注意: RLSポリシーの変更は既存のデータへのアクセスに影響を与える可能性があります。
-- 実行前に影響範囲を確認してください。