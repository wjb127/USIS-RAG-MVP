import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function createEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  
  return response.data[0].embedding
}

export async function generateResponse(prompt: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: '당신은 경영실적 데이터 분석 전문가입니다. 주어진 문서 정보를 바탕으로 정확하고 도움이 되는 답변을 제공하세요. 답변은 한국어로 해주세요.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 1000,
  })
  
  return response.choices[0].message.content
} 