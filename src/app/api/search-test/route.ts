import { NextRequest, NextResponse } from 'next/server'
import { createEmbedding } from '@/lib/openai'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()
    
    if (!query) {
      return NextResponse.json({ error: '검색어가 필요합니다.' }, { status: 400 })
    }

    console.log('🧪 검색 테스트 시작 - 쿼리:', query)

    // 1. 검색어를 임베딩으로 변환
    const queryEmbedding = await createEmbedding(query)
    
    if (!queryEmbedding) {
      return NextResponse.json({ error: '임베딩 생성 실패' }, { status: 500 })
    }

    console.log('✅ 임베딩 생성 완료 - 차원:', queryEmbedding.length)

    // 2. REST API로 벡터 유사도 검색 (여러 임계값 테스트)
    const thresholds = [0.1, 0.3, 0.5, 0.7]
    const results: Record<string, unknown> = {}

    for (const threshold of thresholds) {
      console.log(`🎯 임계값 ${threshold} 테스트...`)
      
      try {
        const searchResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_rag_documents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'apikey': SUPABASE_SERVICE_KEY,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            query_embedding: `[${queryEmbedding.join(',')}]`,
            match_threshold: threshold,
            match_count: 10
          })
        })

        if (searchResponse.ok) {
          const searchResults = await searchResponse.json()
          results[`threshold_${threshold}`] = {
            count: searchResults.length,
            results: searchResults.slice(0, 3).map((doc: { id: number; filename: string; similarity: number; content?: string }) => ({
              id: doc.id,
              filename: doc.filename,
              similarity: doc.similarity,
              content_preview: doc.content?.substring(0, 100) + '...'
            }))
          }
          console.log(`✅ 임계값 ${threshold}: ${searchResults.length}개 결과`)
        } else {
          const errorText = await searchResponse.text()
          results[`threshold_${threshold}`] = {
            error: `HTTP ${searchResponse.status}: ${errorText}`
          }
          console.error(`🚨 임계값 ${threshold} 실패:`, searchResponse.status, errorText)
        }
      } catch (err) {
        results[`threshold_${threshold}`] = {
          error: `Exception: ${err}`
        }
        console.error(`🚨 임계값 ${threshold} 예외:`, err)
      }
    }

    // 3. 기본 문서 조회 (참조용)
    try {
      const allDocsResponse = await fetch(`${SUPABASE_URL}/rest/v1/rag_documents?select=*&limit=5&order=created_at.desc`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY
        }
      })

      if (allDocsResponse.ok) {
        const allDocs = await allDocsResponse.json()
        results.reference_documents = allDocs.map((doc: { id: number; filename: string; embedding?: unknown; content?: string }) => ({
          id: doc.id,
          filename: doc.filename,
          embedding_type: doc.embedding?.toString().startsWith('[') ? 'vector' : 'text',
          content_preview: doc.content?.substring(0, 100) + '...'
        }))
        console.log('✅ 참조 문서 조회 성공:', allDocs.length, '개')
      }
    } catch (refErr) {
      console.error('🚨 참조 문서 조회 실패:', refErr)
    }

    return NextResponse.json({
      query,
      embedding_dimension: queryEmbedding.length,
      method: 'rest_api_test',
      test_results: results
    })
    
  } catch (error) {
    console.error('💥 검색 테스트 오류:', error)
    return NextResponse.json({ error: '검색 테스트 중 오류가 발생했습니다.' }, { status: 500 })
  }
} 