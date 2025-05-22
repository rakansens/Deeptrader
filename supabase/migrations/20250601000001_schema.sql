-- migrate:up
-- スキーマと拡張機能の設定
-- 作成日: 2025/6/1
-- 更新内容: スキーマと基本拡張機能の設定

-- 必要な拡張機能のインストール
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "vector"; 