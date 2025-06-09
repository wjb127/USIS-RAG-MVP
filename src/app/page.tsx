'use client'

import { useState } from 'react'
import { Upload, Send, MessageCircle, FileText } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/lib/utils'

interface Message {
  id: number
  content: string
  isUser: boolean
  timestamp: Date
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      
      if (response.ok) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          content: `✅ "${file.name}" 파일이 성공적으로 업로드되었습니다. (${result.chunks_processed}개 청크 처리됨)`,
          isUser: false,
          timestamp: new Date()
        }])
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        content: `❌ 파일 업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        isUser: false,
        timestamp: new Date()
      }])
    } finally {
      setIsUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/json': ['.json'],
      'text/csv': ['.csv']
    },
    multiple: false
  })

  const sendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputMessage }),
      })

      const result = await response.json()
      
      if (response.ok) {
        const botMessage: Message = {
          id: Date.now() + 1,
          content: result.answer || '답변을 생성할 수 없습니다.',
          isUser: false,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, botMessage])
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        content: `오류: ${error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}`,
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📊 경영실적 RAG 챗봇
            </h1>
            <p className="text-gray-600">
              경영실적 데이터를 업로드하고 AI 챗봇에게 질문해보세요
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 파일 업로드 영역 */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  문서 업로드
                </h2>
                
                <div
                  {...getRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                    isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                  )}
                >
                  <input {...getInputProps()} />
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  {isUploading ? (
                    <p className="text-blue-600">업로드 중...</p>
                  ) : isDragActive ? (
                    <p className="text-blue-600">파일을 여기에 드롭하세요</p>
                  ) : (
                    <div>
                      <p className="text-gray-600">파일을 드래그하거나 클릭하여 업로드</p>
                      <p className="text-sm text-gray-400 mt-1">
                        지원 형식: .txt, .json, .csv
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 채팅 영역 */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md flex flex-col h-[600px]">
                {/* 채팅 헤더 */}
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    AI 어시스턴트
                  </h2>
                </div>

                {/* 메시지 목록 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-20">
                      <MessageCircle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                      <p>경영실적 데이터에 대해 질문해주세요!</p>
                      <p className="text-sm mt-2">먼저 문서를 업로드한 후 질문하시면 더 정확한 답변을 받을 수 있습니다.</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          message.isUser ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
                            message.isUser
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          )}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          <p className={cn(
                            "text-xs mt-1",
                            message.isUser ? "text-blue-200" : "text-gray-500"
                          )}>
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 입력 영역 */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="경영실적에 대해 질문해주세요..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={isLoading || !inputMessage.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
