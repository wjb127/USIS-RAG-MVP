import { NextRequest, NextResponse } from 'next/server'
import { createEmbedding } from '@/lib/openai'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { query, match_threshold = 0.5, match_count = 5 } = await request.json()
    
    console.log('🔍 검색 쿼리:', query)
    console.log('🎯 임계값:', match_threshold, '최대 결과:', match_count)
    
    if (!query) {
      return NextResponse.json({ error: '검색 쿼리가 필요합니다.' }, { status: 400 })
    }

    // 1. 검색 쿼리의 임베딩 생성
    console.log('🧠 검색 쿼리 임베딩 생성 중...')
    const queryEmbedding = await createEmbedding(query)
    
    if (!queryEmbedding) {
      return NextResponse.json({ error: '임베딩 생성에 실패했습니다.' }, { status: 500 })
    }
    
    console.log('✅ 검색 임베딩 생성 완료 - 차원:', queryEmbedding.length)

    // 2. REST API로 벡터 유사도 검색
    console.log('🚀 REST API 벡터 검색 시도 (임계값:', match_threshold, ')...')
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
          match_threshold: match_threshold,
          match_count: match_count
        })
      })

      if (searchResponse.ok) {
        const searchResults = await searchResponse.json()
        console.log('✅ REST API 벡터 검색 결과:', searchResults.length, '개')
        
        if (searchResults.length > 0) {
          return NextResponse.json({
            results: searchResults,
            query: query,
            match_threshold: match_threshold,
            match_count: match_count,
            method: 'rest_api_vector_search'
          })
        } else {
          console.log('⚠️ 벡터 검색 결과 0개, 임계값을 낮춰서 재시도...')
        }
      } else {
        const searchError = await searchResponse.text()
        console.error('🚨 REST API 벡터 검색 실패:', searchResponse.status, searchError)
      }
    } catch (rpcErr) {
      console.error('🚨 REST API 벡터 검색 예외:', rpcErr)
    }

    // 3. 임계값을 낮춰서 재시도 (0.1)
    console.log('🔄 임계값 0.1로 벡터 검색 재시도...')
    try {
      const retryResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_rag_documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          query_embedding: `[${queryEmbedding.join(',')}]`,
          match_threshold: 0.1,
          match_count: match_count
        })
      })

      if (retryResponse.ok) {
        const retryResults = await retryResponse.json()
        console.log('✅ 낮은 임계값 벡터 검색 결과:', retryResults.length, '개')
        
        if (retryResults.length > 0) {
          return NextResponse.json({
            results: retryResults,
            query: query,
            match_threshold: 0.1,
            match_count: match_count,
            method: 'low_threshold_vector_search'
          })
        }
      }
    } catch (retryErr) {
      console.error('🚨 낮은 임계값 검색도 실패:', retryErr)
    }

    // 4. 폴백: 키워드별 텍스트 검색
    console.log('🔧 폴백: 키워드 기반 텍스트 검색...')
    const keywords = query.split(' ').filter((word: string) => word.length > 1)
    console.log('🔤 추출된 키워드:', keywords)
    
    for (const keyword of keywords) {
      try {
        const textSearchResponse = await fetch(`${SUPABASE_URL}/rest/v1/rag_documents?content=ilike.*${encodeURIComponent(keyword)}*&select=*&limit=${match_count}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'apikey': SUPABASE_SERVICE_KEY
          }
        })

        if (textSearchResponse.ok) {
          const textResults = await textSearchResponse.json()
          console.log(`✅ "${keyword}" 텍스트 검색 결과:`, textResults.length, '개')
          
          if (textResults.length > 0) {
            // 유사도 점수 추가 (키워드 매칭 기반)
            const resultsWithSimilarity = textResults.map((doc: any, index: number) => ({
              ...doc,
              similarity: 0.7 - (index * 0.1) // 키워드 매칭 유사도 점수
            }))
            
            return NextResponse.json({
              results: resultsWithSimilarity,
              query: query,
              matched_keyword: keyword,
              match_threshold: match_threshold,
              match_count: match_count,
              method: 'keyword_text_search'
            })
          }
        }
      } catch (textErr) {
        console.error(`🚨 "${keyword}" 텍스트 검색 실패:`, textErr)
      }
    }

    // 5. 최종 폴백: 모든 문서 반환 (관련성 있는 것 우선)
    console.log('💾 최종 폴백: 모든 문서 반환...')
    try {
      const allDocsResponse = await fetch(`${SUPABASE_URL}/rest/v1/rag_documents?select=*&limit=${match_count}&order=created_at.desc`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY
        }
      })

      if (allDocsResponse.ok) {
        const allDocs = await allDocsResponse.json()
        console.log('✅ 모든 문서 조회 성공:', allDocs.length, '개 결과')
        
        if (allDocs.length > 0) {
          const resultsWithSimilarity = allDocs.map((doc: any, index: number) => ({
            ...doc,
            similarity: 0.4 - (index * 0.05) // 낮은 유사도 점수
          }))
          
          return NextResponse.json({
            results: resultsWithSimilarity,
            query: query,
            match_threshold: match_threshold,
            match_count: match_count,
            method: 'fallback_all_documents'
          })
        }
      }
    } catch (allErr) {
      console.error('🚨 모든 문서 조회도 실패:', allErr)
    }

    return NextResponse.json({
      results: [],
      query: query,
      match_threshold: match_threshold,
      match_count: match_count,
      method: 'no_results',
      error: '검색 결과를 찾을 수 없습니다.'
    })

  } catch (error) {
    console.error('💥 검색 오류:', error)
    return NextResponse.json({ error: '검색 중 오류가 발생했습니다.' }, { status: 500 })
  }
} 