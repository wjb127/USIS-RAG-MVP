-- 벡터 확장 활성화
create extension if not exists vector;

-- rag_documents 테이블 생성 (접두사 적용)
create table if not exists rag_documents (
  id bigserial primary key,
  filename text not null,
  content text not null,
  chunk_index integer not null,
  embedding vector(1536), -- OpenAI text-embedding-3-small의 차원
  created_at timestamp with time zone default now()
);

-- 벡터 유사도 검색을 위한 인덱스 생성
create index if not exists rag_documents_embedding_idx on rag_documents 
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- 벡터 유사도 검색 함수 생성 (접두사 적용)
create or replace function match_rag_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  filename text,
  content text,
  chunk_index integer,
  similarity float
)
language sql stable
as $$
  select
    rag_documents.id,
    rag_documents.filename,
    rag_documents.content,
    rag_documents.chunk_index,
    1 - (rag_documents.embedding <=> query_embedding) as similarity
  from rag_documents
  where 1 - (rag_documents.embedding <=> query_embedding) > match_threshold
  order by rag_documents.embedding <=> query_embedding
  limit match_count;
$$;

-- 임베딩과 함께 문서 삽입하는 함수 생성
create or replace function insert_document_with_embedding (
  p_filename text,
  p_content text,
  p_chunk_index integer,
  p_embedding float[]
)
returns json
language plpgsql
as $$
declare
  result_record rag_documents%rowtype;
begin
  insert into rag_documents (filename, content, chunk_index, embedding, created_at)
  values (p_filename, p_content, p_chunk_index, p_embedding::vector, now())
  returning * into result_record;
  
  return row_to_json(result_record);
end;
$$;

-- RLS (Row Level Security) 정책 설정 (선택사항)
-- alter table rag_documents enable row level security;

-- 모든 사용자가 읽기 가능하도록 설정 (개발 단계용)
-- create policy "Allow read access for all users on rag_documents" on rag_documents for select using (true);

-- 인증된 사용자만 쓰기 가능하도록 설정 (개발 단계용)
-- create policy "Allow insert for authenticated users on rag_documents" on rag_documents for insert with check (true); 