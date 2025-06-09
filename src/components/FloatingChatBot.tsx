'use client'

import { useState } from 'react'
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/lib/utils'

interface Message {
  id: number
  content: string
  isUser: boolean
  timestamp: Date
}

export default function FloatingChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [newMessageCount, setNewMessageCount] = useState(0)

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
        const successMessage = {
          id: Date.now(),
          content: `✅ "${file.name}" 파일이 성공적으로 업로드되었습니다. (${result.chunks_processed}개 청크 처리됨)`,
          isUser: false,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, successMessage])
        if (!isOpen) setNewMessageCount(prev => prev + 1)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now(),
        content: `❌ 파일 업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      if (!isOpen) setNewMessageCount(prev => prev + 1)
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
        if (!isOpen) setNewMessageCount(prev => prev + 1)
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
      if (!isOpen) setNewMessageCount(prev => prev + 1)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleChat = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setNewMessageCount(0)
    }
  }

  return (
    <>
      {/* 채팅창 */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-80 h-[500px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
          {/* 헤더 */}
          <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-white" />
              <div>
                <h3 className="text-white font-semibold text-sm">RAG 분석 어시스턴트</h3>
                <p className="text-blue-100 text-xs">경영실적 데이터 분석</p>
              </div>
            </div>
            <button
              onClick={toggleChat}
              className="text-white hover:text-blue-200 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* 파일 업로드 영역 */}
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-2 text-center cursor-pointer transition-colors",
                isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
              )}
            >
              <input {...getInputProps()} />
              <DocumentArrowUpIcon className="mx-auto h-4 w-4 text-gray-400 mb-1" />
              {isUploading ? (
                <p className="text-blue-600 text-xs">업로드 중...</p>
              ) : isDragActive ? (
                <p className="text-blue-600 text-xs">파일을 드롭하세요</p>
              ) : (
                <p className="text-gray-600 text-xs">파일 업로드</p>
              )}
            </div>
          </div>

          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <ChatBubbleLeftRightIcon className="mx-auto h-6 w-6 text-gray-300 mb-2" />
                <p className="text-xs">경영실적 데이터를 분석해드립니다</p>
                <div className="mt-3 text-xs text-gray-400 space-y-1">
                                <p>💡 &quot;매출이 높은 회사는?&quot;</p>
              <p>💡 &quot;평균 영업이익률은?&quot;</p>
              <p>💡 &quot;성장률이 높은 업종은?&quot;</p>
                </div>
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
                      "max-w-[85%] px-2 py-1.5 rounded-lg text-xs",
                      message.isUser
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-gray-100 text-gray-900 rounded-bl-none"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className={cn(
                      "text-xs mt-1 opacity-70",
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
                <div className="bg-gray-100 text-gray-900 max-w-[85%] px-2 py-1.5 rounded-lg rounded-bl-none">
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 입력 영역 */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="질문을 입력하세요..."
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="px-2 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 플로팅 버튼 */}
      <button
        onClick={toggleChat}
        className="fixed bottom-4 right-4 w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center z-40"
      >
        <div className="relative">
          <ChatBubbleLeftRightIcon className="h-6 w-6" />
          {/* 새 메시지 배지 */}
          {newMessageCount > 0 && (
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
              {newMessageCount > 9 ? '9+' : newMessageCount}
            </div>
          )}
        </div>
      </button>
    </>
  )
} 