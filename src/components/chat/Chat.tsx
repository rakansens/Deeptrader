"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpIcon, ChevronLeft, ChevronRight, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MessageBubble from "./message-bubble";
import ConversationSidebar from "./conversation-sidebar";
import { useChat } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Chat() {
  const {
    messages,
    input,
    setInput,
    loading,
    error,
    conversations,
    selectedId,
    selectConversation,
    newConversation,
    renameConversation,
    removeConversation,
    sidebarOpen,
    toggleSidebar,
    sendMessage,
  } = useChat();
  const { toast } = useToast();
  const listRef = useRef<HTMLDivElement>(null);

  const exportConversation = (format: 'json' | 'txt') => {
    const data =
      format === 'json'
        ? JSON.stringify(messages, null, 2)
        : messages.map((m) => `${m.role}: ${m.content}`).join('\n');
    const blob = new Blob([data], {
      type: format === 'json' ? 'application/json' : 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation_${selectedId}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 新しいメッセージや読み込み状態の変化でスクロールを最下部に移動
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // エラーが発生した場合にトースト表示
  useEffect(() => {
    if (error) {
      toast({ title: "エラー", description: error });
    }
  }, [error, toast]);

  return (
    <div className="flex h-full relative">
      <div
        className={cn(
          'relative overflow-hidden transition-all duration-300',
          sidebarOpen ? 'w-56' : 'w-0'
        )}
      >
        <ConversationSidebar
          conversations={conversations}
          selectedId={selectedId}
          onSelect={selectConversation}
          onRename={renameConversation}
          onRemove={removeConversation}
          className={cn(
            'absolute inset-0 w-56 md:relative md:block border-r bg-background flex flex-col transition-transform duration-300',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
          footer={
            <Button variant="outline" className="w-full" onClick={newConversation}>
              新しいチャット
            </Button>
          }
        />
      </div>
      <div className="flex-1 flex flex-col h-full p-4 relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={sidebarOpen ? "スレッドを非表示" : "スレッドを表示"}
              onClick={toggleSidebar}
              className="text-muted-foreground hover:text-foreground"
            >
              {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>

          <div>
            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="会話をエクスポート"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>会話をエクスポート</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => exportConversation('json')}>
                  JSONでダウンロード
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => exportConversation('txt')}>
                  テキストでダウンロード
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div ref={listRef} className="flex-1 overflow-y-auto space-y-4 pr-2 mt-2">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
              <p className="mb-4">質問や指示を入力してください</p>
              <div className="flex flex-col gap-2 mx-auto w-full max-w-sm">
                {[
                  "ビットコインの現在のトレンドは？",
                  "RSIが示す売買シグナルは？",
                  "ボリンジャーバンドの使い方を教えて",
                  "現在の市場リスクを分析して",
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
              <MessageBubble
                key={idx}
                role={m.role}
                timestamp={m.timestamp}
                avatar={m.role === "user" ? "U" : "AI"}
              >
                {m.content}
              </MessageBubble>
            ))
          )}
          {loading && messages[messages.length - 1]?.role !== "assistant" && (
            <MessageBubble role="assistant" typing>
              <span className="text-sm">考え中...</span>
            </MessageBubble>
          )}
          {error && !loading && (
            <MessageBubble role="assistant">
              <div className="text-red-700 dark:text-red-400">{error}</div>
            </MessageBubble>
          )}
        </div>
        <div className="mt-4 relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="メッセージを入力..."
            className="min-h-[80px] resize-none pr-12 focus-visible:ring-primary"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            size="icon"
            aria-label="送信"
            className="absolute right-2 bottom-2"
          >
            <ArrowUpIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
