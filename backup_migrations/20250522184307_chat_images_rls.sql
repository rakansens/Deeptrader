-- migrate:up
-- 008_chat_images_rls.sql
-- chat_imagesテーブルのRow Level Security (RLS) 設定
-- 作成日: 2024/5/22
-- 更新内容: 画像アップロードのセキュリティポリシーを整備

-- chat_imagesテーブルに対してRLSを有効化
alter table public.chat_images enable row level security;

-- 既存のRLSポリシーをいったん削除（冪等性のため）
drop policy if exists "Users can only access their own chat images" on public.chat_images;
drop policy if exists "Users can insert their own chat images" on public.chat_images;
drop policy if exists "Public chat images are accessible by everyone" on public.chat_images;

-- ユーザーは自分のチャット画像のみ参照可能
create policy "Users can only access their own chat images"
  on public.chat_images
  for select
  using (auth.uid() = user_id);

-- ユーザーは自分のチャット画像のみ挿入可能
create policy "Users can insert their own chat images"
  on public.chat_images
  for insert
  with check (auth.uid() = user_id);

-- パブリック設定されているチャット画像はすべてのユーザーが参照可能
create policy "Public chat images are accessible by everyone"
  on public.chat_images
  for select
  using (is_public = true);

-- chat_imagesテーブルにis_publicフラグが存在しない場合は追加
do $$
begin
  if not exists (
    select from information_schema.columns
    where table_schema = 'public'
    and table_name = 'chat_images'
    and column_name = 'is_public'
  ) then
    alter table public.chat_images add column is_public boolean default false;
  end if;
end $$;

-- migrate:down
-- chat_imagesテーブルのRLSポリシーをロールバック
drop policy if exists "Public chat images are accessible by everyone" on public.chat_images;
drop policy if exists "Users can insert their own chat images" on public.chat_images;
drop policy if exists "Users can only access their own chat images" on public.chat_images;

-- RLSを無効化（元の状態に戻す場合）
-- alter table public.chat_images disable row level security; 