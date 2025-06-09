import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createEmbedding, generateResponse } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()
    
    if (!message) {
      return NextResponse.json({ error: '메시지가 필요합니다.' }, { status: 400 })
    }

    // 사용자 질문을 임베딩으로 변환
    const queryEmbedding = await createEmbedding(message)
    
    // 벡터 유사도 검색으로 관련 문서 찾기
    const { data: similarDocs, error } = await supabaseAdmin.rpc('match_rag_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: 5
    })
    
    if (error) {
      console.error('문서 검색 오류:', error)
      return NextResponse.json({ error: '문서 검색 중 오류가 발생했습니다.' }, { status: 500 })
    }
    
    // 검색된 문서들을 컨텍스트로 구성
    const context = similarDocs
      .map((doc: any) => doc.content)
      .join('\n\n')
    
    // GPT에게 질문과 컨텍스트를 전달하여 답변 생성
    const prompt = `
다음은 경영실적 관련 문서들입니다:

${context}

사용자 질문: ${message}

위의 문서 정보를 바탕으로 사용자의 질문에 대해 정확하고 상세한 답변을 제공해주세요. 만약 문서에 관련 정보가 없다면, 그렇다고 명시해주세요.
`
    
    const answer = await generateResponse(prompt)
    
    return NextResponse.json({ 
      answer,
      sources: similarDocs.length,
      context_used: context.length > 0
    })
    
  } catch (error) {
    console.error('채팅 오류:', error)
    return NextResponse.json({ error: '채팅 중 오류가 발생했습니다.' }, { status: 500 })
  }
} 