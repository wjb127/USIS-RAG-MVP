'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { ArrowUpIcon, ChartBarIcon, CurrencyDollarIcon, UsersIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline'

// 샘플 데이터
const salesData = [
  { company: 'ABC회사', sales: 1200, growth: 15 },
  { company: '테크코프', sales: 850, growth: 28 },
  { company: '그린에너지', sales: 950, growth: 45 },
  { company: '바이오텍메드', sales: 680, growth: 22 },
  { company: '스마트로지스틱스', sales: 1450, growth: 35 },
  { company: '스마트푸드', sales: 780, growth: 180 },
]

const profitabilityData = [
  { company: 'ABC회사', 영업이익률: 15, 순이익률: 10, ROE: 18.5 },
  { company: '테크코프', 영업이익률: 20, 순이익률: 15.1, ROE: 22.5 },
  { company: '그린에너지', 영업이익률: 10, 순이익률: 7.1, ROE: 15.2 },
  { company: '바이오텍메드', 영업이익률: 11, 순이익률: 7.6, ROE: 13.8 },
  { company: '스마트로지스틱스', 영업이익률: 6, 순이익률: 4, ROE: 12.5 },
  { company: '스마트푸드', 영업이익률: 5, 순이익률: 2.9, ROE: 9.2 },
]

const industryData = [
  { name: 'IT/소프트웨어', value: 2, color: '#3B82F6' },
  { name: '제조업', value: 1, color: '#EF4444' },
  { name: '재생에너지', value: 1, color: '#10B981' },
  { name: '바이오테크', value: 1, color: '#8B5CF6' },
  { name: '물류', value: 1, color: '#F59E0B' },
]

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#8B5CF6', '#F59E0B']

export default function Dashboard() {
  const totalSales = salesData.reduce((sum, company) => sum + company.sales, 0)
  const avgGrowth = salesData.reduce((sum, company) => sum + company.growth, 0) / salesData.length
  const totalCompanies = salesData.length

  return (
    <div className="space-y-6">
      {/* KPI 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">총 매출</p>
              <p className="text-2xl font-bold text-gray-900">{totalSales.toLocaleString()}억</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">평균 성장률</p>
              <div className="flex items-center">
                <p className="text-2xl font-bold text-gray-900">{avgGrowth.toFixed(1)}%</p>
                <ArrowUpIcon className="h-4 w-4 text-green-500 ml-1" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">분석 기업 수</p>
              <p className="text-2xl font-bold text-gray-900">{totalCompanies}개</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <UsersIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">총 직원 수</p>
              <p className="text-2xl font-bold text-gray-900">5,550명</p>
            </div>
          </div>
        </div>
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 매출 및 성장률 차트 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">회사별 매출 현황</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="company" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}억원`, '매출']} />
              <Bar dataKey="sales" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 수익성 지표 차트 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">수익성 지표 비교</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={profitabilityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="company" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}%`]} />
              <Line type="monotone" dataKey="영업이익률" stroke="#EF4444" strokeWidth={2} />
              <Line type="monotone" dataKey="순이익률" stroke="#10B981" strokeWidth={2} />
              <Line type="monotone" dataKey="ROE" stroke="#8B5CF6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 업종별 분포 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">업종별 분포</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={industryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {industryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 주요 지표 테이블 */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">주요 재무 지표</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    회사명
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    매출 (억원)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    성장률 (%)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    영업이익률 (%)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ROE (%)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salesData.map((company, index) => (
                  <tr key={company.company} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {company.company}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {company.sales.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        {company.growth}%
                        {company.growth > 20 ? (
                          <ArrowUpIcon className="h-4 w-4 text-green-500 ml-1" />
                        ) : (
                          <ArrowUpIcon className="h-4 w-4 text-gray-400 ml-1" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {profitabilityData[index]?.영업이익률}%
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {profitabilityData[index]?.ROE}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
} 