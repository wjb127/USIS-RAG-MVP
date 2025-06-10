import { NextRequest, NextResponse } from 'next/server'
import { generateResponse } from '@/lib/openai'
import { searchDocuments } from '@/lib/search'

// searchDocuments 함수의 타입은 src/lib/search.ts에서 import됩니다

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()
    
    if (!message) {
      return NextResponse.json({ error: '메시지가 필요합니다.' }, { status: 400 })
    }

    console.log('💬 채팅 요청:', message)

    // 문서 검색 함수 직접 호출 (Vercel 내부 호출 문제 해결)
    const searchData = await searchDocuments(message, 0.3, 10)
    
    console.log('🔍 검색 결과:', {
      method: searchData.method,
      total_results: searchData.results.length,
      query: searchData.query
    })
    
    // 검색 결과로부터 컨텍스트 생성
    const context = searchData.results.map(doc => doc.content).join('\n\n')
    
    // GPT에게 질문과 컨텍스트를 전달하여 답변 생성
    let prompt = ''
    
    if (context.length > 0) {
      prompt = `
다음은 업로드된 경영실적 관련 문서들입니다:

${context}

사용자 질문: ${message}

위의 문서 정보를 바탕으로 사용자의 질문에 대해 한국어로 정확하고 상세한 답변을 제공해주세요. 구체적인 수치나 데이터가 있다면 그것을 인용해서 답변해주세요.
`
    } else {
      // 문서가 없는 경우에도 기본 답변 제공
      prompt = `
사용자 질문: ${message}

업로드된 문서에서 관련 정보를 찾을 수 없습니다. 하지만 일반적인 경영실적 분석에 대한 답변을 제공해주세요. 먼저 관련 문서를 업로드하라고 안내해주세요.
`
    }
    
    console.log('🤖 GPT 프롬프트 길이:', prompt.length, '문자')
    
    const answer = await generateResponse(prompt)
    
    console.log('✅ GPT 답변 생성 완료')
    
    return NextResponse.json({ 
      answer,
      sources: searchData.results.length,
      context_used: context.length > 0,
      search_method: searchData.method,
      search_results: searchData.results.map(doc => ({
        id: doc.id,
        filename: doc.filename,
        similarity: doc.similarity,
        content_preview: doc.content?.substring(0, 100) + '...'
      }))
    })
    
  } catch (error) {
    console.error('💥 채팅 오류:', error)
    return NextResponse.json({ error: '채팅 중 오류가 발생했습니다.' }, { status: 500 })
  }
} 