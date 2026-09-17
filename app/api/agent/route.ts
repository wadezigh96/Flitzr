import { NextResponse } from 'next/server'
import { bankrPrompt } from '@/lib/bankr'

export async function POST(request: Request) {
  try {
    const { prompt, threadId } = await request.json()
    if (typeof prompt !== 'string' || !prompt.trim()) return NextResponse.json({error:'Prompt is required'}, {status:400})
    const result = await bankrPrompt(prompt.trim(), threadId)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Agent request failed'
    return NextResponse.json({error:message}, {status:500})
  }
}
