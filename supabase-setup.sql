-- ============================================
-- CORTEX: Supabase Database Setup
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Enable the pgvector extension for vector similarity search
create extension if not exists vector;

-- 2. Documents table (stores uploaded papers)
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_url text,
  created_at timestamptz default now()
);

-- 3. Chunks table (stores text chunks + their vector embeddings)
create table if not exists chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  content text not null,
  chunk_index integer not null,
  embedding vector(768),
  created_at timestamptz default now()
);

-- 4. Create an index for fast vector similarity search
create index if not exists chunks_embedding_idx on chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- 5. Vector similarity search function
-- This is called from the app via supabase.rpc('match_chunks', ...)
create or replace function match_chunks(
  query_embedding vector(768),
  match_count int default 8,
  filter_document_id uuid default null
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  chunk_index integer,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    chunks.id,
    chunks.document_id,
    chunks.content,
    chunks.chunk_index,
    1 - (chunks.embedding <=> query_embedding) as similarity
  from chunks
  where (filter_document_id is null or chunks.document_id = filter_document_id)
  order by chunks.embedding <=> query_embedding
  limit match_count;
end;
$$;
