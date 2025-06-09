import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  try {
    console.log('🔍 문서 디버그 조회 시작...')
    
    // REST API로 모든 문서 조회
    const documentsResponse = await fetch(`${SUPABASE_URL}/rest/v1/rag_documents?select=*&order=created_at.desc`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Prefer': 'count=exact'
      }
    })

    if (!documentsResponse.ok) {
      const errorText = await documentsResponse.text()
      console.error('🚨 문서 조회 실패:', documentsResponse.status, errorText)
      return NextResponse.json({ error: '문서 조회 실패' }, { status: 500 })
    }

    const documents = await documentsResponse.json()
    const totalCount = documentsResponse.headers.get('content-range')?.split('/')[1] || '0'
    
    console.log('✅ 디버그 문서 조회 성공:', documents.length, '개, 총', totalCount, '개')

    // 문서 통계 생성
    const stats = {
      total_documents: parseInt(totalCount),
      documents_fetched: documents.length,
      unique_filenames: [...new Set(documents.map((doc: any) => doc.filename))],
      embedding_types: documents.reduce((acc: any, doc: any) => {
        const embeddingStr = doc.embedding?.toString() || ''
        let type = 'none'
        
        if (embeddingStr.startsWith('[') && embeddingStr.endsWith(']')) {
          type = 'vector'
        } else if (embeddingStr.startsWith('{') || embeddingStr.startsWith('"')) {
          type = 'text'
        }
        
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {}),
      sample_documents: documents.slice(0, 3).map((doc: any) => ({
        id: doc.id,
        filename: doc.filename,
        content_preview: doc.content?.substring(0, 100) + '...',
        embedding_type: doc.embedding?.toString().startsWith('[') ? 'vector' : 'text',
        created_at: doc.created_at
      }))
    }
    
    return NextResponse.json({
      success: true,
      method: 'rest_api',
      stats,
      raw_documents: documents
    })
    
  } catch (error) {
    console.error('💥 디버그 조회 오류:', error)
    return NextResponse.json({ error: '디버그 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
} 