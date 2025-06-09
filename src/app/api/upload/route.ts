import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createEmbedding } from '@/lib/openai'
import { chunkText } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: '파일이 필요합니다.' }, { status: 400 })
    }

    // 파일 내용 읽기
    const text = await file.text()
    
    // 텍스트를 청크로 분할
    const chunks = chunkText(text)
    
    // 각 청크에 대해 임베딩 생성 및 데이터베이스 저장
    const results = []
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      
      // 임베딩 생성
      const embedding = await createEmbedding(chunk)
      
      // Supabase에 저장
      const { data, error } = await supabaseAdmin
        .from('rag_documents')
        .insert({
          filename: file.name,
          content: chunk,
          chunk_index: i,
          embedding: embedding,
          created_at: new Date().toISOString()
        })
        .select()
      
      if (error) {
        console.error('DB 저장 오류:', error)
        continue
      }
      
      results.push(data[0])
    }
    
    return NextResponse.json({ 
      message: '문서가 성공적으로 업로드되었습니다.',
      chunks_processed: results.length 
    })
    
  } catch (error) {
    console.error('업로드 오류:', error)
    return NextResponse.json({ error: '업로드 중 오류가 발생했습니다.' }, { status: 500 })
  }
} 