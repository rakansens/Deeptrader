'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUpIcon, LoaderCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev, 
        { role: 'assistant', content: 'すみません、エラーが発生しました。後でもう一度お試しください。' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
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
