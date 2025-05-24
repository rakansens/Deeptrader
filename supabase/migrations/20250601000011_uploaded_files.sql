-- 🎯 ファイル管理テーブル追加
-- 作成日: 2025/1/25
-- 目的: アバター画像・チャート画像・その他ファイルの管理

-- ✅ アップロードファイル管理テーブル
CREATE TABLE public.uploaded_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL, -- Supabaseストレージ内のファイル名
  original_name TEXT NOT NULL, -- 元のファイル名
  file_type TEXT NOT NULL CHECK (file_type IN ('avatar_user', 'avatar_assistant', 'chart_screenshot', 'document', 'other')),
  file_size BIGINT NOT NULL, -- ファイルサイズ（バイト）
  mime_type TEXT NOT NULL, -- MIMEタイプ
  storage_bucket TEXT NOT NULL DEFAULT 'avatars', -- Supabaseストレージバケット名
  storage_path TEXT NOT NULL, -- ストレージ内のパス
  public_url TEXT, -- 公開URL（キャッシュ用）
  is_active BOOLEAN DEFAULT true, -- アクティブかどうか
  metadata JSONB, -- 追加メタデータ（画像の場合は解像度等）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス追加（高速検索用）
CREATE INDEX idx_uploaded_files_user_type ON public.uploaded_files(user_id, file_type);
CREATE INDEX idx_uploaded_files_storage_path ON public.uploaded_files(storage_bucket, storage_path);
CREATE INDEX idx_uploaded_files_active ON public.uploaded_files(is_active);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_uploaded_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_uploaded_files_updated_at
    BEFORE UPDATE ON public.uploaded_files
    FOR EACH ROW
    EXECUTE FUNCTION update_uploaded_files_updated_at();

-- ストレージクリーンアップ用関数（非アクティブファイル削除）
CREATE OR REPLACE FUNCTION cleanup_inactive_files()
RETURNS void AS $$
BEGIN
    -- 30日以上非アクティブなファイルを削除対象としてマーク
    UPDATE public.uploaded_files 
    SET is_active = false 
    WHERE is_active = true 
      AND updated_at < NOW() - INTERVAL '30 days'
      AND file_type IN ('chart_screenshot', 'document', 'other');
END;
$$ LANGUAGE plpgsql; 