import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  try {
    console.log('🔍 데이터베이스 상태 확인 시작...')
    
    const checks: Record<string, unknown> = {}

    // 1. 테이블 존재 확인 (PostgreSQL 시스템 테이블 조회)
    try {
      const tablesResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/sql_query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY
        },
        body: JSON.stringify({
          query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rag_documents'"
        })
      })

      if (tablesResponse.ok) {
        const tablesData = await tablesResponse.json()
        checks.table_exists = tablesData.length > 0
        console.log('✅ 테이블 존재 확인:', checks.table_exists)
      } else {
        // 폴백: 직접 테이블 조회 시도
        const directTableResponse = await fetch(`${SUPABASE_URL}/rest/v1/rag_documents?select=id&limit=1`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'apikey': SUPABASE_SERVICE_KEY
          }
        })
        checks.table_exists = directTableResponse.ok
        console.log('✅ 테이블 존재 확인 (폴백):', checks.table_exists)
      }
    } catch (tableErr) {
      checks.table_exists = false
      console.error('🚨 테이블 확인 실패:', tableErr)
    }

    // 2. pgvector 확장 확인
    try {
      const extensionsResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/sql_query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY
        },
        body: JSON.stringify({
          query: "SELECT extname FROM pg_extension WHERE extname = 'vector'"
        })
      })

      if (extensionsResponse.ok) {
        const extensionsData = await extensionsResponse.json()
        checks.vector_extension = extensionsData.length > 0
        console.log('✅ pgvector 확장 확인:', checks.vector_extension)
      } else {
        checks.vector_extension = false
        console.log('⚠️ pgvector 확장 확인 실패')
      }
    } catch (extErr) {
      checks.vector_extension = false
      console.error('🚨 확장 확인 실패:', extErr)
    }

    // 3. RPC 함수 존재 확인
    try {
      const functionsResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/sql_query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY
        },
        body: JSON.stringify({
          query: "SELECT proname FROM pg_proc WHERE proname IN ('insert_document_with_embedding', 'match_rag_documents')"
        })
      })

      if (functionsResponse.ok) {
        const functionsData = await functionsResponse.json()
        checks.rpc_functions = {
          insert_function: functionsData.some((f: { proname: string }) => f.proname === 'insert_document_with_embedding'),
          search_function: functionsData.some((f: { proname: string }) => f.proname === 'match_rag_documents'),
          total_found: functionsData.length
        }
        console.log('✅ RPC 함수 확인:', checks.rpc_functions)
      } else {
        checks.rpc_functions = { error: 'Failed to check functions' }
        console.log('⚠️ RPC 함수 확인 실패')
      }
    } catch (funcErr) {
      checks.rpc_functions = { error: funcErr }
      console.error('🚨 함수 확인 실패:', funcErr)
    }

    // 4. 컬럼 정보 확인
    try {
      const columnsResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/sql_query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY
        },
        body: JSON.stringify({
          query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'rag_documents' ORDER BY ordinal_position"
        })
      })

      if (columnsResponse.ok) {
        const columnsData = await columnsResponse.json()
        checks.table_columns = columnsData
        console.log('✅ 컬럼 정보 확인:', columnsData.length, '개 컬럼')
      } else {
        checks.table_columns = { error: 'Failed to get columns' }
      }
    } catch (colErr) {
      checks.table_columns = { error: colErr }
      console.error('🚨 컬럼 확인 실패:', colErr)
    }

    // 5. 샘플 데이터 확인
    try {
      const sampleResponse = await fetch(`${SUPABASE_URL}/rest/v1/rag_documents?select=*&limit=3&order=created_at.desc`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY,
          'Prefer': 'count=exact'
        }
      })

      if (sampleResponse.ok) {
        const sampleData = await sampleResponse.json()
        const totalCount = sampleResponse.headers.get('content-range')?.split('/')[1] || '0'
        
        checks.sample_data = {
          total_documents: parseInt(totalCount),
          sample_count: sampleData.length,
          samples: sampleData.map((doc: { id: number; filename: string; embedding?: unknown; content: string; created_at: string }) => ({
            id: doc.id,
            filename: doc.filename,
            embedding_type: doc.embedding?.toString().startsWith('[') ? 'vector' : 'text',
            has_content: !!doc.content,
            created_at: doc.created_at
          }))
        }
        console.log('✅ 샘플 데이터 확인:', totalCount, '개 문서')
      } else {
        checks.sample_data = { error: 'Failed to get sample data' }
      }
    } catch (sampleErr) {
      checks.sample_data = { error: sampleErr }
      console.error('🚨 샘플 데이터 확인 실패:', sampleErr)
    }

    console.log('✅ 데이터베이스 상태 확인 완료')

    return NextResponse.json({
      success: true,
      method: 'rest_api',
      timestamp: new Date().toISOString(),
      checks
    })
    
  } catch (error) {
    console.error('💥 DB 확인 오류:', error)
    return NextResponse.json({ error: 'DB 확인 중 오류가 발생했습니다.' }, { status: 500 })
  }
} 