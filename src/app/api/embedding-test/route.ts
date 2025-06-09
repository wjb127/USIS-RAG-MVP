import { NextRequest, NextResponse } from 'next/server'
import { createEmbedding } from '@/lib/openai'

export async function GET(request: NextRequest) {
  try {
    const testText = "ABC 회사 2023년 매출 1200억원"
    
    console.log('테스트 텍스트:', testText)
    
    const embedding = await createEmbedding(testText)
    
    console.log('임베딩 타입:', typeof embedding)
    console.log('임베딩 길이:', embedding?.length)
    console.log('임베딩 첫 5개 값:', embedding?.slice(0, 5))
    console.log('임베딩이 배열인가?', Array.isArray(embedding))
    
    return NextResponse.json({
      text: testText,
      embedding_type: typeof embedding,
      embedding_length: embedding?.length,
      is_array: Array.isArray(embedding),
      first_5_values: embedding?.slice(0, 5),
      embedding_sample: embedding?.slice(0, 20) // 처음 20개만
    })
    
  } catch (error) {
    console.error('임베딩 테스트 오류:', error)
    return NextResponse.json({ error: '임베딩 테스트 중 오류가 발생했습니다.' }, { status: 500 })
  }
} 