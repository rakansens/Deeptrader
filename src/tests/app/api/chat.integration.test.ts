/**
 * @jest-environment node
 */
import { POST } from '@/app/api/chat/route'

jest.mock('@/lib/supabase', () => ({
  createServiceRoleClient: () => ({
    from: jest.fn(() => ({ insert: jest.fn() })),
  }),
}))


describe('POST /api/chat', () => {
  const originalEnv = process.env
  const originalFetch = global.fetch

  beforeEach(() => {
    process.env = { ...originalEnv, OPENAI_API_KEY: 'test-key' }
  })

  afterEach(() => {
    process.env = originalEnv
    global.fetch = originalFetch
    jest.clearAllMocks()
  })

  it('正常なレスポンスを返すこと', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'テスト返信' } }],
      }),
    }) as jest.Mock

    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'こんにちは' }),
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.reply).toBe('テスト返信')
    expect(global.fetch).toHaveBeenCalled()
  })

  it('OpenAI API エラー時にエラーレスポンスを返すこと', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'error',
    }) as jest.Mock

    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'こんにちは' }),
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('OpenAI request failed')
  })
})
