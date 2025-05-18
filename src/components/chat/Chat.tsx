"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpIcon, LoaderCircle, ChevronLeft, ChevronRight } from "lucide-react";
import MessageBubble from "./message-bubble";
import ConversationSidebar from "./conversation-sidebar";
import { useChat } from "@/hooks/use-chat";

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

  return (
    <div className="flex h-full relative">
      {sidebarOpen && (
        <ConversationSidebar
          conversations={conversations}
          selectedId={selectedId}
          onSelect={selectConversation}
          onRename={renameConversation}
          onRemove={removeConversation}
          className="hidden md:block"
          footer={
            <Button variant="outline" className="w-full" onClick={newConversation}>
              新しいチャット
            </Button>
          }
        />
      )}
      <div className="flex-1 flex flex-col h-full p-4 relative">
        <Button
          variant="ghost"
          size="icon"
          aria-label={sidebarOpen ? "スレッドを非表示" : "スレッドを表示"}
          onClick={toggleSidebar}
          className="absolute -left-6 top-2 hidden md:flex"
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
        <div className="mb-2 flex justify-end md:hidden">
          <Button
            variant="ghost"
            size="icon"
            aria-label={sidebarOpen ? "スレッドを非表示" : "スレッドを表示"}
            onClick={toggleSidebar}
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
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
              <MessageBubble key={idx} role={m.role}>
                {m.content}
              </MessageBubble>
            ))
          )}
          {loading && (
            <MessageBubble role="assistant" typing>
              <div className="flex items-center">
                <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">考え中...</span>
              </div>
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
            className="absolute right-2 bottom-2"
          >
            <ArrowUpIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
