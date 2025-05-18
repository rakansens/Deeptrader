# Supabase セットアップ

このプロジェクトではバックエンドとして Supabase を使用します。以下の手順でプロジェクトを作成し、環境変数を設定してください。

## 1. プロジェクトの作成

1. [Supabase](https://supabase.com) にサインアップし、新しいプロジェクトを作成します。
2. プロジェクトの `Project URL` と `Anon Public` キーを取得します。
3. (必要に応じて) `Service Role` キーも取得します。

## 2. 環境変数の設定

リポジトリのルートにある `.env.example` をコピーして `.env.local` を作成し、以下の値を入力します。

```bash
cp .env.example .env.local
```

`.env.local` には次の変数を設定します。

```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

その他の API キーも必要に応じて設定してください。

## 3. テーブル定義

`supabase/schema.sql` にユーザー認証と会話履歴保存用のテーブル定義を用意しています。Supabase の SQL Editor から実行してテーブルを作成してください。

- `profiles`: `auth.users` と紐付くユーザー情報
- `conversations`: ユーザーごとの会話セッション
- `messages`: 各会話のメッセージ履歴

テーブル作成後、Row Level Security (RLS) ポリシーを設定して適切にアクセス制御を行ってください。

