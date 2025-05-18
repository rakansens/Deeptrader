import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const conversationId = searchParams.get('conversationId')
  const supabase = createServiceRoleClient()
  let query = supabase.from('messages').select('*').order('created_at', { ascending: true })
  if (conversationId) {
    query = query.eq('conversation_id', conversationId)
  }
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const values = await request.json().catch(() => ({}))
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('messages')
    .insert(values)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
