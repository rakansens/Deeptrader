-- 00_schema.sql
-- 基本的なスキーマ定義（拡張機能の追加など）
-- 作成日: 2025/5/20
-- 更新内容: 初期作成、必要な拡張機能の追加、storageスキーマのコメントアウト

/*
このスクリプトは基本的なスキーマ定義と必要な拡張機能をインストールします。
主な内容:
- スキーマの作成
- 必要な拡張機能のインストール
- スキーマに関するコメントの追加
*/

-- トランザクション開始
BEGIN;

-- スキーマの作成
CREATE SCHEMA IF NOT EXISTS public;

-- 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";     -- UUID生成用
CREATE EXTENSION IF NOT EXISTS "pgcrypto";      -- 暗号化機能用
CREATE EXTENSION IF NOT EXISTS "pg_net";        -- ネットワーク機能用
CREATE EXTENSION IF NOT EXISTS "vector";        -- ベクトル検索用

-- ストレージスキーマ作成
-- CREATE SCHEMA IF NOT EXISTS storage;

-- スキーマに関するコメント
COMMENT ON SCHEMA public IS 'Deeptraderアプリケーションのデータを格納するスキーマ';
-- COMMENT ON SCHEMA storage IS 'Deeptraderアプリケーションのストレージ関連データを格納するスキーマ';

-- トランザクション終了
COMMIT;