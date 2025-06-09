'use client'

import { useState } from 'react'
import { ChartBarIcon, Cog6ToothIcon, DocumentChartBarIcon, UsersIcon, ChatBubbleLeftRightIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import Dashboard from '@/components/Dashboard'
import ChatPanel from '@/components/ChatPanel'
import FloatingChatBot from '@/components/FloatingChatBot'
import DocumentManager from '@/components/DocumentManager'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rag' | 'documents' | 'reports' | 'users' | 'settings'>('dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">BusinessRAG Pro</h1>
                  <p className="text-xs text-gray-500">AI 기반 경영관리시스템</p>
                </div>
              </div>
            </div>
            
            <nav className="flex items-center space-x-1">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'dashboard' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <ChartBarIcon className="w-4 h-4 inline-block mr-2" />
                대시보드
              </button>
              <button 
                onClick={() => setActiveTab('rag')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'rag' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <ChatBubbleLeftRightIcon className="w-4 h-4 inline-block mr-2" />
                RAG 분석
              </button>
              <button 
                onClick={() => setActiveTab('documents')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'documents' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <DocumentTextIcon className="w-4 h-4 inline-block mr-2" />
                문서 관리
              </button>
              <button 
                onClick={() => setActiveTab('reports')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'reports' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <DocumentChartBarIcon className="w-4 h-4 inline-block mr-2" />
                보고서
              </button>
              <button 
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'users' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <UsersIcon className="w-4 h-4 inline-block mr-2" />
                사용자
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'settings' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Cog6ToothIcon className="w-4 h-4 inline-block mr-2" />
                설정
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">경영실적 대시보드</h2>
              <p className="text-gray-600">
                AI 기반 데이터 분석으로 기업 성과를 한눈에 파악하세요
                <span className="ml-2 text-blue-600 text-sm">💬 우하단 챗봇으로 간단한 질문을, RAG 분석 탭에서 심화 분석을!</span>
              </p>
            </div>
            <Dashboard />
          </div>
        )}

        {activeTab === 'rag' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">RAG 기반 데이터 분석</h2>
                <p className="text-gray-600">
                  자연어로 질문하면 AI가 경영실적 데이터를 분석해서 답변해드립니다
                </p>
              </div>
              
              {/* 빠른 질문 예시 */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 추천 질문</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-colors">
                    <p className="text-sm text-gray-700">&quot;매출이 가장 높은 회사는 어디인가요?&quot;</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-colors">
                                          <p className="text-sm text-gray-700">&quot;평균 영업이익률을 알려주세요&quot;</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-colors">
                                          <p className="text-sm text-gray-700">&quot;IT 업종 회사들의 성장률은?&quot;</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-colors">
                                          <p className="text-sm text-gray-700">&quot;R&D 투자를 가장 많이 하는 회사는?&quot;</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-colors">
                                          <p className="text-sm text-gray-700">&quot;수익성이 가장 좋은 회사는?&quot;</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-colors">
                                          <p className="text-sm text-gray-700">&quot;성장률과 수익성을 종합적으로 분석해줘&quot;</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <ChatPanel />
            </div>
          </div>
        )}

        {activeTab === 'documents' && <DocumentManager />}

        {activeTab === 'reports' && (
          <div className="text-center py-16">
            <DocumentChartBarIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">보고서 기능</h3>
            <p className="text-gray-500">곧 출시 예정입니다.</p>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="text-center py-16">
            <UsersIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">사용자 관리</h3>
            <p className="text-gray-500">곧 출시 예정입니다.</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="text-center py-16">
            <Cog6ToothIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">시스템 설정</h3>
            <p className="text-gray-500">곧 출시 예정입니다.</p>
          </div>
        )}
      </main>

      {/* 플로팅 챗봇 - RAG 분석 탭일 때는 숨김 */}
      {activeTab !== 'rag' && <FloatingChatBot />}
    </div>
  )
}
