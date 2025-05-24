# Database Scripts

このディレクトリには、DeepTraderアプリケーションのデータベース管理用スクリプトが含まれています。

## 重要な変更 (2025-05-24)

### LocalStorageからDB専用への移行

アプリケーションは以前、会話とメッセージデータをLocalStorageとデータベースの両方で管理していましたが、これが以下の問題を引き起こしていました：

1. **データ同期の問題**: LocalStorageとDBの間でデータが不整合になる
2. **重複会話の作成**: 初期化時に同じ会話が複数作成される
3. **メッセージの重複表示**: 異なる会話IDで同じメッセージが表示される

これらの問題を解決するため、**LocalStorageを完全に廃止し、データベース専用の実装に移行しました**。

### 変更内容

1. **`use-conversations.ts`**: 
   - LocalStorage関連のコードを削除
   - 初期化時は常にDBから読み込み
   - 会話の作成・更新・削除は全てDB経由

2. **`use-chat.ts`**:
   - メッセージの読み込み・保存は全てDB経由
   - 送信履歴のみLocalStorageに保持（会話とは独立した機能）

## スクリプト一覧

### 01_cleanup_duplicate_conversations.sql
重複した会話とメッセージのクリーンアップを行うスクリプト。
- 重複会話の検出
- 孤立したメッセージの確認
- LocalStorageキー情報の出力

### 02_cleanup_localstorage_data.sql
LocalStorageからDB専用への移行後のクリーンアップスクリプト。
- ユーザーごとの会話・メッセージ数の確認
- 孤立したメッセージの削除
- 重複タイトルの会話の確認

### 03_delete_empty_conversations.sql
メッセージを持たない空の会話を削除するためのヘルパースクリプト。
- 空の会話の検出
- ユーザーごとの空会話数の確認
- 一括削除コマンド（コメントアウト済み）

## 使用方法

```bash
# スクリプトの実行
psql $DATABASE_URL < scripts/database/スクリプト名.sql

# 例：空の会話を確認
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres < scripts/database/03_delete_empty_conversations.sql

# 空の会話を削除（注意：破壊的操作）
psql $DATABASE_URL -c "DELETE FROM conversations WHERE id IN (SELECT c.id FROM conversations c LEFT JOIN chat_messages cm ON c.id = cm.conversation_id WHERE cm.id IS NULL);"
```

## 注意事項

- 削除操作を実行する前に必ずバックアップを取ってください
- 本番環境での実行は十分なテストの後に行ってください
- スクリプト内の削除コマンドはコメントアウトされています。実行する場合は手動でコメントを外してください 