import { NextRequest, NextResponse } from 'next/server'
import { createEmbedding } from '@/lib/openai'
import { chunkText } from '@/lib/utils'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: '파일이 필요합니다.' }, { status: 400 })
    }

    // 파일 내용 읽기
    const text = await file.text()
    
    console.log('📁 파일명:', file.name)
    console.log('📏 파일 크기:', text.length, '문자')
    console.log('👀 파일 내용 미리보기:', text.substring(0, 200) + '...')
    
    // 텍스트를 청크로 분할
    const chunks = chunkText(text)
    
    console.log('🔪 생성된 청크 개수:', chunks.length)
    console.log('📝 첫 번째 청크 미리보기:', chunks[0]?.substring(0, 100) + '...')
    
    // 각 청크에 대해 임베딩 생성 및 데이터베이스 저장
    const results = []
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      
      // 임베딩 생성
      const embedding = await createEmbedding(chunk)
      
      console.log(`🧠 청크 ${i} 임베딩 생성 완료 - 차원:`, embedding?.length)
      console.log(`🔍 청크 ${i} 임베딩 타입:`, typeof embedding, Array.isArray(embedding) ? '배열' : '비배열')
      
      // 방법 1: REST API로 RPC 함수 호출
      console.log(`🚀 청크 ${i} REST API RPC 호출 시작...`)
      try {
        const rpcResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/insert_document_with_embedding`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'apikey': SUPABASE_SERVICE_KEY,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            p_filename: file.name,
            p_content: chunk,
            p_chunk_index: i,
            p_embedding: embedding
          })
        })

        if (rpcResponse.ok) {
          const rpcData = await rpcResponse.json()
          console.log(`✅ 청크 ${i} REST API RPC 저장 성공:`, rpcData)
          results.push(rpcData)
          continue
        } else {
          const rpcError = await rpcResponse.text()
          console.error(`🚨 청크 ${i} REST API RPC 실패:`, rpcResponse.status, rpcError)
        }
      } catch (rpcErr) {
        console.error(`🚨 청크 ${i} REST API RPC 예외:`, rpcErr)
      }

      // 방법 2: 직접 SQL INSERT (벡터 형식)
      console.log(`🔧 청크 ${i} 직접 SQL INSERT 시도...`)
      try {
        const sqlResponse = await fetch(`${SUPABASE_URL}/rest/v1/rag_documents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'apikey': SUPABASE_SERVICE_KEY,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            filename: file.name,
            content: chunk,
            chunk_index: i,
            embedding: `[${embedding.join(',')}]`, // PostgreSQL 벡터 형식
            created_at: new Date().toISOString()
          })
        })

        if (sqlResponse.ok) {
          const sqlData = await sqlResponse.json()
          console.log(`✅ 청크 ${i} 직접 SQL 저장 성공:`, sqlData[0])
          results.push(sqlData[0])
          continue
        } else {
          const sqlError = await sqlResponse.text()
          console.error(`🚨 청크 ${i} 직접 SQL 실패:`, sqlResponse.status, sqlError)
        }
      } catch (sqlErr) {
        console.error(`🚨 청크 ${i} 직접 SQL 예외:`, sqlErr)
      }

      // 방법 3: 폴백 - 텍스트로 저장
      console.log(`💾 청크 ${i} 폴백 방식으로 저장 시도...`)
      try {
        const fallbackResponse = await fetch(`${SUPABASE_URL}/rest/v1/rag_documents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'apikey': SUPABASE_SERVICE_KEY,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            filename: file.name,
            content: chunk,
            chunk_index: i,
            embedding: JSON.stringify(embedding), // JSON 문자열로 저장
            created_at: new Date().toISOString()
          })
        })

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          console.log(`✅ 청크 ${i} 폴백 저장 성공 (텍스트 타입):`, fallbackData[0])
          results.push(fallbackData[0])
        } else {
          const fallbackError = await fallbackResponse.text()
          console.error(`🚨 청크 ${i} 폴백 저장도 실패:`, fallbackResponse.status, fallbackError)
        }
      } catch (fallbackErr) {
        console.error(`🚨 청크 ${i} 폴백 저장 예외:`, fallbackErr)
      }
    }
    
    console.log(`📊 총 처리된 청크: ${results.length}/${chunks.length}`)
    
    return NextResponse.json({ 
      message: '문서가 성공적으로 업로드되었습니다.',
      chunks_processed: results.length,
      total_chunks: chunks.length,
      success_rate: `${Math.round((results.length / chunks.length) * 100)}%`
    })
    
  } catch (error) {
    console.error('💥 업로드 오류:', error)
    return NextResponse.json({ error: '업로드 중 오류가 발생했습니다.' }, { status: 500 })
  }
} 