import { NextResponse } from 'next/server'
import { getExecution, transition } from '@/lib/execution'

export async function POST(request: Request) {
  try {
    const { executionId, approval } = await request.json()
    if (typeof executionId !== 'string' || !executionId) {
      return NextResponse.json({ error: 'executionId is required' }, { status: 400 })
    }
    if (approval !== true) {
      return NextResponse.json({ error: 'Explicit approval is required.' }, { status: 400 })
    }

    const execution = getExecution(executionId)
    if (!execution) return NextResponse.json({ error: 'Execution not found' }, { status: 404 })

    const approved = transition(execution, 'approved')
    return NextResponse.json({ execution: approved, previewOnly: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Approval failed'
    return NextResponse.json({ error: message }, { status: 409 })
  }
}
