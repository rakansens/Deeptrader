import { fetchWithTimeout } from '@/lib/fetch'

describe('fetchWithTimeout', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    jest.useRealTimers()
    jest.clearAllTimers()
  })

  it('throws on timeout', async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new DOMException('aborted', 'AbortError'))
    ) as unknown as typeof fetch

    await expect(
      fetchWithTimeout('https://example.com', { timeout: 10 })
    ).rejects.toThrow('Request timed out')
  })

  it('resolves when fetch succeeds before timeout', async () => {
    jest.useFakeTimers()
    const res = {} as Response
    global.fetch = jest.fn().mockResolvedValue(res)

    const p = fetchWithTimeout('https://example.com', { timeout: 10 })
    jest.advanceTimersByTime(0)
    await jest.runOnlyPendingTimersAsync()
    await expect(p).resolves.toBe(res)
  })
})
