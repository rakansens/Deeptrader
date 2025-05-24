-- 🎯 ストレージバケット作成
-- 作成日: 2025/1/25
-- 目的: アバター画像・チャート画像用のStorageバケット設定

-- アバター画像用バケット作成
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('charts', 'charts', false, 20971520, ARRAY['image/jpeg', 'image/png']);

-- アバターバケットのRLSポリシー設定
CREATE POLICY "アバター画像は誰でも読み取り可能" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "ユーザーは自分のアバターを操作可能" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "ユーザーは自分のアバターを更新可能" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "ユーザーは自分のアバターを削除可能" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- チャートバケットのRLSポリシー設定（プライベート）
CREATE POLICY "ユーザーは自分のチャートのみアクセス可能" ON storage.objects FOR ALL USING (bucket_id = 'charts' AND auth.uid()::text = (storage.foldername(name))[1]); 