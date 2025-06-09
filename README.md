# 📊 경영실적 RAG 챗봇

Next.js 15, Supabase, OpenAI를 활용한 RAG(Retrieval-Augmented Generation) 시스템입니다. 경영실적 데이터를 업로드하고 AI 챗봇에게 질문할 수 있습니다.

## 🚀 기능

- 📝 문서 업로드 (TXT, JSON, CSV)
- 🔍 벡터 유사도 검색
- 💬 AI 챗봇 대화
- 📊 경영실적 데이터 분석

## 🛠️ 기술 스택

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI**: OpenAI GPT-4, text-embedding-3-small
- **UI**: Lucide React, React Dropzone

## ⚙️ 설정 방법

### 1. 환경 변수 설정

\`.env.local\` 파일을 다음과 같이 설정하세요:

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

### 2. Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. SQL 에디터에서 \`supabase-setup.sql\` 파일의 내용 실행
3. 프로젝트 URL과 API 키를 환경 변수에 설정

### 3. OpenAI API 키 설정

1. [OpenAI Platform](https://platform.openai.com/api-keys)에서 API 키 생성
2. 환경 변수에 설정

### 4. 의존성 설치 및 실행

\`\`\`bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
\`\`\`

## 📖 사용 방법

1. **문서 업로드**: 좌측 업로드 영역에 경영실적 관련 문서를 드래그 앤 드롭
2. **질문하기**: 우측 채팅 영역에서 AI 어시스턴트에게 질문
3. **답변 받기**: 업로드된 문서를 기반으로 한 정확한 답변 확인

## 🏗️ 프로젝트 구조

\`\`\`
src/
├── app/
│   ├── api/
│   │   ├── chat/          # 채팅 API
│   │   └── upload/        # 파일 업로드 API
│   ├── globals.css        # 글로벌 스타일
│   ├── layout.tsx         # 루트 레이아웃
│   └── page.tsx           # 메인 페이지
├── lib/
│   ├── openai.ts          # OpenAI 클라이언트
│   ├── supabase.ts        # Supabase 클라이언트
│   └── utils.ts           # 유틸리티 함수
\`\`\`

## 🔧 주요 파일 설명

- **src/app/api/upload/route.ts**: 문서 업로드 및 벡터화 처리
- **src/app/api/chat/route.ts**: RAG 기반 채팅 응답 생성
- **src/lib/openai.ts**: OpenAI API 연동 (임베딩, GPT-4)
- **src/lib/supabase.ts**: Supabase 데이터베이스 연동
- **supabase-setup.sql**: 데이터베이스 스키마 및 함수 정의

## 🌟 특징

- **벡터 검색**: pgvector를 활용한 고성능 유사도 검색
- **청킹**: 긴 문서를 적절한 크기로 분할하여 처리
- **실시간 UI**: 업로드 및 채팅 상태를 실시간으로 표시
- **모던 디자인**: Tailwind CSS를 활용한 반응형 UI

## 📄 라이선스

MIT License
