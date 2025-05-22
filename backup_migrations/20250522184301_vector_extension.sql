-- migrate:up
-- 003_vector_extension.sql
-- pgvector拡張とmemories_vectorテーブルの作成
-- 作成日: 2024/5/22
-- 更新内容: RAGのためのベクトル検索用テーブルと関数を設定

-- pgvector拡張がなければ作成
create extension if not exists vector;

-- memories_vectorテーブル作成
create table if not exists public.memories_vector(
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  content text not null,
  embedding vector(1536) not null,
  metadata jsonb default '{}'::jsonb,
  is_public boolean default false,
  created_at timestamptz default now()
);

-- RLS (Row Level Security) の設定
alter table public.memories_vector enable row level security;

-- 所有者のみが自分のメモリーにアクセス可能
create policy "Users can only access their own memories"
  on public.memories_vector
  for all
  using (auth.uid() = user_id);

-- パブリックメモリーは全員がアクセス可能
create policy "Everyone can access public memories"
  on public.memories_vector
  for select
  using (is_public = true);

-- HNSWインデックスの作成（効率的なベクトル検索のため）
create index if not exists "memories_vector_hnsw_idx"
  on public.memories_vector
  using hnsw (embedding vector_l2_ops)
  with (m = 16, ef_construction = 64);

-- match_documents関数の更新 (1536次元ベクトル対応)
drop function if exists public.match_documents;
create or replace function public.match_documents(
  query_embedding vector,
  match_threshold float,
  match_count int,
  user_id text
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    mv.id,
    mv.content,
    mv.metadata,
    1 - (mv.embedding <=> query_embedding) as similarity
  from public.memories_vector mv
  where 
    (mv.user_id = user_id::uuid or mv.is_public = true)
    and 1 - (mv.embedding <=> query_embedding) > match_threshold
  order by mv.embedding <=> query_embedding
  limit match_count;
$$;

-- migrate:down
-- pgvector関連のオブジェクトをロールバック
drop function if exists public.match_documents;
drop index if exists "memories_vector_hnsw_idx";
drop policy if exists "Everyone can access public memories" on public.memories_vector;
drop policy if exists "Users can only access their own memories" on public.memories_vector;
drop table if exists public.memories_vector;
-- 他のデータベースで使用される可能性があるため、拡張機能自体は削除しない
-- drop extension if exists vector; 