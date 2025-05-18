'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUpIcon, LoaderCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Chat() {
  const [conversations, setConversations] = useState<{ id: string }[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 会話リストの取得
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch('/api/conversations');
        if (!res.ok) return;
        const data = await res.json();
        setConversations(data);
        if (data.length > 0 && !selectedConversation) {
          setSelectedConversation(data[0].id);
        }
      } catch (e) {
        console.error('Failed to load conversations');
      }
    };
    fetchConversations();
  }, []);

  // 会話変更時にメッセージ取得
  useEffect(() => {
    if (!selectedConversation) return;
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/messages?conversationId=${selectedConversation}`);
        if (!res.ok) return;
        const data = await res.json();
        setMessages(
          data.map((m: any) => ({ role: m.sender as 'user' | 'assistant', content: m.content }))
        );
      } catch (e) {
        console.error('Failed to load messages');
      }
    };
    fetchMessages();
  }, [selectedConversation]);

  const createConversation = async () => {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'test_user' })
    });
    if (res.ok) {
      const data = await res.json();
      setConversations((prev) => [...prev, data]);
      setSelectedConversation(data.id);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    if (!selectedConversation) {
      await createConversation();
    }
    setInput('');
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    if (selectedConversation) {
      fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selectedConversation,
          sender: 'user',
          content: text,
        }),
      }).catch(() => {});
    }
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      
      if (!res.ok) {
        // レスポンスがJSONでない場合にエラーをキャッチ
        let errorMessage = '';
        try {
          const data = await res.json();
          errorMessage = data.error || `APIエラー: ${res.status}`;
        } catch (e) {
          errorMessage = `APIエラー: ${res.status}`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
        if (selectedConversation) {
          fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversation_id: selectedConversation,
              sender: 'assistant',
              content: data.reply,
            }),
          }).catch(() => {});
        }
      } else {
        throw new Error('APIからの応答が無効です');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'メッセージ送信中にエラーが発生しました';
      setError(errorMessage);
      setMessages((prev) => [
        ...prev, 
        { role: 'assistant', content: `すみません、エラーが発生しました: ${errorMessage}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2">
        <Button onClick={createConversation} size="sm">新しい会話</Button>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={selectedConversation ?? ''}
          onChange={(e) => setSelectedConversation(e.target.value)}
        >
          {conversations.map((c) => (
            <option key={c.id} value={c.id}>
              {c.id.slice(0, 8)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
            <p className="mb-4">質問や指示を入力してください</p>
            <div className="flex flex-col gap-2 mx-auto w-full max-w-sm">
              {[
                'ビットコインの現在のトレンドは？',
                'RSIが示す売買シグナルは？',
                'ボリンジャーバンドの使い方を教えて',
                '現在の市場リスクを分析して'
              ].map((suggestion) => (
                <Button 
                  key={suggestion} 
                  variant="outline" 
                  className="text-sm h-auto py-2 px-3 justify-start text-left w-full"
                  onClick={() => {
                    setInput(suggestion);
                  }}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, idx) => (
            <div 
              key={idx} 
              className={`${
                m.role === 'user' 
                  ? 'bg-primary/10 border-l-4 border-primary ml-4' 
                  : 'bg-muted/50'
              } p-4 rounded-md`}
            >
              <p className="text-sm font-medium mb-1">
                {m.role === 'user' ? 'あなた' : 'DeepTrader AI'}
              </p>
              <div className="text-sm whitespace-pre-wrap">{m.content}</div>
            </div>
          ))
        )}
        {loading && (
          <div className="bg-muted/50 p-4 rounded-md">
            <p className="text-sm font-medium mb-1">DeepTrader AI</p>
            <div className="flex items-center">
              <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm">考え中...</span>
            </div>
          </div>
        )}
        {error && !loading && (
          <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-md">
            <p className="text-sm font-medium mb-1 text-red-800 dark:text-red-300">
              エラー
            </p>
            <div className="text-sm whitespace-pre-wrap text-red-700 dark:text-red-400">
              {error}
            </div>
          </div>
        )}
      </div>
      <div className="mt-4 relative">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="メッセージを入力..."
          className="min-h-[80px] resize-none pr-12 focus-visible:ring-primary"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <Button 
          onClick={sendMessage} 
          disabled={loading || !input.trim()} 
          size="icon"
          className="absolute right-2 bottom-2"
        >
          <ArrowUpIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
