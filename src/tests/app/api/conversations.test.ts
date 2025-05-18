import { POST, GET } from '@/app/api/conversations/route'
import { NextResponse } from 'next/server'

jest.mock('@/lib/supabase', () => {
  const mockFrom = {
    select: jest.fn().mockResolvedValue({ data: [{ id: 'c1' }], error: null }),
    insert: jest.fn(() => ({ select: () => ({ single: () => Promise.resolve({ data: { id: 'c2' }, error: null }) }) }))
  }
  return {
    createServiceRoleClient: () => ({ from: () => mockFrom })
  }
})

describe('conversations API', () => {
  it('POST creates conversation', async () => {
    const req = new Request('http://test', { method: 'POST', body: JSON.stringify({ user_id: 'u1' }) })
    const res = await POST(req)
    expect(res).toBeInstanceOf(NextResponse)
    const data = await res.json()
    expect(data).toEqual({ id: 'c2' })
  })

  it('GET returns list', async () => {
    const res = await GET()
    const data = await res.json()
    expect(data).toEqual([{ id: 'c1' }])
  })
})
