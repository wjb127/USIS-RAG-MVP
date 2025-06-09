'use client'

import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, TrashIcon, DocumentTextIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

interface DocumentInfo {
  id: number
  filename: string
  content: string
  chunk_index: number
  created_at: string
  embedding_type: string
  embedding_dimension: number | null
  content_preview?: string
}

interface DocumentsResponse {
  documents: DocumentInfo[]
  total_count: number
  page: number
  limit: number
  total_pages: number
  method: string
}

export default function DocumentManager() {
  const [documents, setDocuments] = useState<DocumentInfo[]>([])
  const [filenames, setFilenames] = useState<string[]>([])
  const [selectedFilename, setSelectedFilename] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedChunks, setExpandedChunks] = useState<Set<number>>(new Set())

  const fetchDocuments = async (page = 1, filename = '', search = '') => {
    setIsLoading(true)
    try {
      console.log('📋 문서 조회 요청:', { page, filename, search })
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })
      
      if (filename) {
        params.append('filename', filename)
      }
      
      if (search) {
        params.append('search', search)
      }

      const response = await fetch(`/api/documents?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data: DocumentsResponse = await response.json()
      
      console.log('✅ 문서 조회 응답:', {
        documents_count: data.documents?.length || 0,
        total_count: data.total_count,
        method: data.method,
        sample_filenames: data.documents?.slice(0, 3).map(d => d.filename),
        response_structure: Object.keys(data)
      })

      if (data.documents) {
        setDocuments(data.documents)
        setCurrentPage(data.page || 1)
        setTotalPages(data.total_pages || 1)
        setTotalCount(data.total_count || 0)
        
        // 파일명 목록 생성 (중복 제거)
        const uniqueFilenames = [...new Set(data.documents.map(doc => doc.filename))]
        setFilenames(uniqueFilenames)
      } else {
        console.warn('⚠️ 문서 데이터가 없습니다:', data)
        setDocuments([])
        setFilenames([])
        setTotalCount(0)
      }
    } catch (error) {
      console.error('💥 문서 조회 오류:', error)
      alert('문서 조회 중 오류가 발생했습니다.')
      setDocuments([])
      setFilenames([])
    } finally {
      setIsLoading(false)
    }
  }

  const deleteDocument = async (id: number) => {
    if (!confirm('이 문서 청크를 삭제하시겠습니까?')) return

    try {
      console.log('🗑️ 문서 삭제 요청:', id)
      
      const response = await fetch(`/api/documents?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      console.log('✅ 문서 삭제 성공:', data)
      
      if (data.success) {
        alert('문서가 삭제되었습니다.')
        fetchDocuments(currentPage, selectedFilename, searchTerm)
      } else {
        alert('문서 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('💥 문서 삭제 오류:', error)
      alert('문서 삭제 중 오류가 발생했습니다.')
    }
  }

  const deleteAllFileChunks = async (filename: string) => {
    if (!confirm(`"${filename}" 파일의 모든 청크를 삭제하시겠습니까?`)) return

    try {
      console.log('🗑️ 파일 전체 삭제 요청:', filename)
      
      const response = await fetch(`/api/documents?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      console.log('✅ 파일 삭제 성공:', data)
      
      if (data.success) {
        alert(`파일 &quot;${filename}&quot;의 모든 청크가 삭제되었습니다.`)
        setSelectedFilename('') // 선택 초기화
        fetchDocuments(1, '', searchTerm) // 전체 목록으로 돌아가기
      } else {
        alert('파일 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('💥 파일 삭제 오류:', error)
      alert('파일 삭제 중 오류가 발생했습니다.')
    }
  }

  const toggleChunkExpansion = (id: number) => {
    const newExpanded = new Set(expandedChunks)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedChunks(newExpanded)
  }

  // 클라이언트 측 필터링 (API에서 이미 필터링하지만 추가 필터링 가능)
  const filteredDocuments = documents.filter(doc =>
    doc.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.filename?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    console.log('🔄 DocumentManager 마운트 - 초기 문서 조회')
    fetchDocuments()
  }, [])

  const handleFilenameChange = (filename: string) => {
    console.log('📂 파일명 필터 변경:', filename)
    setSelectedFilename(filename)
    setCurrentPage(1)
    fetchDocuments(1, filename, searchTerm)
  }

  const handlePageChange = (page: number) => {
    console.log('📄 페이지 변경:', page)
    fetchDocuments(page, selectedFilename, searchTerm)
  }

  const handleSearchChange = (search: string) => {
    console.log('🔍 검색어 변경:', search)
    setSearchTerm(search)
    setCurrentPage(1)
    // 실시간 검색은 클라이언트에서만 처리 (성능을 위해)
    // API 호출은 Enter 키나 검색 버튼 클릭 시에만
  }

  const performSearch = () => {
    console.log('🔍 검색 실행:', searchTerm)
    setCurrentPage(1)
    fetchDocuments(1, selectedFilename, searchTerm)
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">📚 문서 관리</h2>
        <div className="text-sm text-gray-600 space-y-1">
          <div>표시: {filteredDocuments.length}개 청크</div>
          <div>전체: {totalCount}개 문서</div>
          <div className="text-red-600 font-mono text-xs">
            DEBUG: documents.length={documents.length}, isLoading={isLoading.toString()}
          </div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 파일명 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              파일 선택
            </label>
            <select
              value={selectedFilename}
              onChange={(e) => handleFilenameChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">모든 파일 ({filenames.length}개)</option>
              {filenames.map(filename => (
                <option key={filename} value={filename}>
                  {filename}
                </option>
              ))}
            </select>
          </div>

          {/* 내용 검색 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              내용 검색
            </label>
            <div className="relative flex">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && performSearch()}
                placeholder="문서 내용 또는 파일명 검색..."
                className="flex-1 pl-10 pr-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
              <button
                onClick={performSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors"
              >
                검색
              </button>
            </div>
          </div>
        </div>

        {/* 선택된 파일 전체 삭제 버튼 */}
        {selectedFilename && (
          <div className="mt-4 pt-4 border-t">
            <button
              onClick={() => deleteAllFileChunks(selectedFilename)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <TrashIcon className="h-4 w-4" />
              &quot;{selectedFilename}&quot; 전체 삭제
            </button>
          </div>
        )}
      </div>

      {/* 문서 목록 */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">문서를 불러오는 중...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>조건에 맞는 문서가 없습니다.</p>
            {searchTerm && (
              <p className="text-sm mt-2">
                검색어: &quot;{searchTerm}&quot; 
                <button 
                  onClick={() => {
                    setSearchTerm('')
                    fetchDocuments(1, selectedFilename, '')
                  }}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  검색 초기화
                </button>
              </p>
            )}
          </div>
        ) : (
          filteredDocuments.map((doc) => (
            <div key={doc.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {doc.filename}
                    </h3>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      청크 #{doc.chunk_index}
                    </span>
                    <div className="flex items-center gap-2">
                      {doc.embedding_type === 'vector' ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircleIcon className="h-4 w-4" />
                          <span className="text-xs">벡터 ({doc.embedding_dimension}차원)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircleIcon className="h-4 w-4" />
                          <span className="text-xs">텍스트 타입</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">
                    업로드: {new Date(doc.created_at).toLocaleString('ko-KR')}
                  </p>
                </div>
                
                <button
                  onClick={() => deleteDocument(doc.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="삭제"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              {/* 내용 미리보기/전체보기 */}
              <div className="border-t pt-4">
                <div className="text-sm text-gray-700">
                  {expandedChunks.has(doc.id) ? (
                    <div className="whitespace-pre-wrap">{doc.content}</div>
                  ) : (
                    <div>{doc.content?.substring(0, 200) || '내용 없음'}...</div>
                  )}
                </div>
                
                {doc.content && doc.content.length > 200 && (
                  <button
                    onClick={() => toggleChunkExpansion(doc.id)}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    {expandedChunks.has(doc.id) ? '접기' : '전체 보기'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            이전
          </button>
          
          <span className="px-3 py-2 text-sm text-gray-600">
            {currentPage} / {totalPages} 페이지 (총 {totalCount}개)
          </span>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  )
} 