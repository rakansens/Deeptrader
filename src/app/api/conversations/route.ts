import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase.from('conversations').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const values = await request.json().catch(() => ({}))
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: values.user_id })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
