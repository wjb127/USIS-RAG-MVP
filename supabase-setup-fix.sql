-- 1. pgvector 확장 활성화 (이미 있어도 오류 없음)
create extension if not exists vector;

-- 2. 기존 함수가 있으면 삭제
drop function if exists insert_document_with_embedding(text, text, integer, float[]);
drop function if exists match_rag_documents(vector, float, integer);

-- 3. 임베딩과 함께 문서 삽입하는 함수 생성 (최신 버전)
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
  vector_embedding vector(1536);
begin
  -- float[] 배열을 vector(1536) 타입으로 변환
  vector_embedding := p_embedding::vector(1536);
  
  insert into rag_documents (filename, content, chunk_index, embedding, created_at)
  values (p_filename, p_content, p_chunk_index, vector_embedding, now())
  returning * into result_record;
  
  return row_to_json(result_record);
end;
$$;

-- 4. 벡터 유사도 검색 함수 생성 (최신 버전)
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
  similarity float,
  created_at timestamptz
)
language plpgsql
as $$
begin
  return query
  select
    rag_documents.id,
    rag_documents.filename,
    rag_documents.content,
    rag_documents.chunk_index,
    1 - (rag_documents.embedding <=> query_embedding) as similarity,
    rag_documents.created_at
  from rag_documents
  where 1 - (rag_documents.embedding <=> query_embedding) > match_threshold
  order by rag_documents.embedding <=> query_embedding
  limit match_count;
end;
$$; 