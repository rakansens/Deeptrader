import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'

interface Params { params: { id: string } }

export async function GET(_: Request, { params }: Params) {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('id', params.id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: Request, { params }: Params) {
  const values = await request.json().catch(() => ({}))
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('messages')
    .update(values)
    .eq('id', params.id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: Request, { params }: Params) {
  const supabase = createServiceRoleClient()
  const { error } = await supabase.from('messages').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
