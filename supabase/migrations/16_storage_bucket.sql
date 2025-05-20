-- 16_storage_bucket.sql
-- Supabaseストレージバケットを作成
-- 作成日: 2024/05/26

-- ストレージ拡張のインストール
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE SCHEMA IF NOT EXISTS storage;

-- ストレージバケットテーブルの作成（存在しない場合）
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  owner uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  public boolean DEFAULT false
);

-- ストレージオブジェクトテーブルの作成（存在しない場合）
CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text REFERENCES storage.buckets(id),
  name text,
  owner uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb,
  path text
);

-- chat-imagesバケットを作成
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING; 