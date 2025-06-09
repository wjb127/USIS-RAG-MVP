import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// 문서 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const filename = searchParams.get('filename')
    const search = searchParams.get('search')
    
    console.log('📋 문서 조회:', { page, limit, filename, search })
    
    const offset = (page - 1) * limit
    
    // URL 빌드
    let url = `${SUPABASE_URL}/rest/v1/rag_documents?select=*&offset=${offset}&limit=${limit}&order=created_at.desc`
    
    // 필터 추가
    if (filename) {
      url += `&filename=eq.${encodeURIComponent(filename)}`
    }
    if (search) {
      url += `&content=ilike.*${encodeURIComponent(search)}*`
    }
    
    console.log('🌐 REST API URL:', url)
    
    // REST API 호출
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Range': `${offset}-${offset + limit - 1}`,
        'Prefer': 'count=exact'
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('🚨 문서 조회 실패:', response.status, errorText)
      return NextResponse.json({ error: '문서 조회 중 오류가 발생했습니다.' }, { status: 500 })
    }
    
    const documents = await response.json()
    const totalCount = response.headers.get('content-range')?.split('/')[1] || '0'
    
    console.log('✅ 문서 조회 성공:', documents.length, '개, 총', totalCount, '개')
    
    // 임베딩 타입 분석
            const documentsWithTypes = documents.map((doc: { id: number; filename: string; content: string; chunk_index: number; created_at: string; embedding?: unknown }) => {
      let embedding_type = 'unknown'
      let embedding_dimension = null
      
      if (doc.embedding) {
        const embeddingStr = doc.embedding.toString()
        if (embeddingStr.startsWith('[') && embeddingStr.endsWith(']')) {
          embedding_type = 'vector'
          try {
            const parsed = JSON.parse(embeddingStr)
            embedding_dimension = Array.isArray(parsed) ? parsed.length : null
          } catch {
            embedding_type = 'vector_string'
          }
        } else if (embeddingStr.startsWith('{') || embeddingStr.startsWith('"')) {
          embedding_type = 'text'
        }
      }
      
      return {
        ...doc,
        embedding_type,
        embedding_dimension,
        content_preview: doc.content?.substring(0, 200) + '...'
      }
    })
    
    return NextResponse.json({
      documents: documentsWithTypes,
      total_count: parseInt(totalCount),
      page,
      limit,
      total_pages: Math.ceil(parseInt(totalCount) / limit),
      method: 'rest_api'
    })
    
  } catch (error) {
    console.error('💥 문서 조회 오류:', error)
    return NextResponse.json({ error: '문서 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 문서 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')
    const documentId = searchParams.get('id')
    
    console.log('🗑️ 문서 삭제 요청:', { filename, documentId })
    
    if (!filename && !documentId) {
      return NextResponse.json({ error: 'filename 또는 id가 필요합니다.' }, { status: 400 })
    }
    
    let deleteUrl = `${SUPABASE_URL}/rest/v1/rag_documents`
    
    if (documentId) {
      deleteUrl += `?id=eq.${documentId}`
    } else if (filename) {
      deleteUrl += `?filename=eq.${encodeURIComponent(filename)}`
    }
    
    console.log('🌐 DELETE URL:', deleteUrl)
    
    // REST API로 삭제
    const deleteResponse = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Prefer': 'return=minimal'
      }
    })
    
    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text()
      console.error('🚨 문서 삭제 실패:', deleteResponse.status, errorText)
      return NextResponse.json({ error: '문서 삭제 중 오류가 발생했습니다.' }, { status: 500 })
    }
    
    const deletedCount = deleteResponse.headers.get('content-range')?.split('/')[0] || '0'
    console.log('✅ 문서 삭제 성공:', deletedCount, '개 삭제됨')
    
    return NextResponse.json({
      success: true,
      message: filename 
        ? '파일의 모든 청크가 삭제되었습니다.' 
        : '문서가 삭제되었습니다.',
      deleted_count: parseInt(deletedCount.split('-')[1] || deletedCount) + 1,
      method: 'rest_api'
    })
    
  } catch (error) {
    console.error('💥 문서 삭제 오류:', error)
    return NextResponse.json({ error: '문서 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }
} 