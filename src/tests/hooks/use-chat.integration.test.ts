import { renderHook, act } from '@testing-library/react';
import { TextEncoder } from 'util';
import { ReadableStream } from 'stream/web';
import { useChat } from '@/hooks/chat/use-chat';

// 実際のfetchを模倣するモック
const mockFetch = (response = 'test response') => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(response));
      controller.close();
    }
  });

  return jest.fn().mockResolvedValue({
    ok: true,
    body: stream,
    headers: new Headers()
  });
};

// グローバルオブジェクトのモック
global.TextEncoder = TextEncoder as unknown as typeof global.TextEncoder;
// @ts-ignore - テストで使用するグローバルReadableStreamの型定義の問題を無視
global.ReadableStream = ReadableStream as any;

// fetchのモック化
global.fetch = jest.fn();

describe('useChat integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('sends message and receives streamed response', async () => {
    global.fetch = mockFetch('受信したレスポンス');

    const { result } = renderHook(() => useChat());

    // メッセージを入力
    act(() => {
      result.current.setInput('テストメッセージ');
    });

    // メッセージを送信
    await act(async () => {
      await result.current.sendMessage();
    });

    // チャットの状態を検証
    expect(result.current.messages.length).toBe(2);
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[0].content).toBe('テストメッセージ');
    expect(result.current.messages[1].role).toBe('assistant');
    expect(result.current.messages[1].content).toBe('受信したレスポンス');

    // ローカルストレージに保存されたことを確認
    const savedMessages = JSON.parse(localStorage.getItem('messages_current') || '[]');
    expect(savedMessages.length).toBe(2);
    expect(savedMessages[0].content).toBe('テストメッセージ');
    expect(savedMessages[1].content).toBe('受信したレスポンス');
  });
});
