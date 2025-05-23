// src/components/chart/UICommandConsole.tsx
// UI操作WebSocket接続状態表示コンソール
'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUICommandWebSocket } from "@/hooks/useUICommandWebSocket";
import { Wifi, WifiOff, RefreshCw, Terminal } from "lucide-react";
import { useState } from "react";

export function UICommandConsole() {
  const { isConnected, lastCommand, connect, disconnect } = useUICommandWebSocket();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 bg-background/95 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            UI Command Console
          </div>
          <Badge 
            variant={isConnected ? "default" : "destructive"} 
            className="text-xs"
          >
            {isConnected ? (
              <div className="flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                接続中
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <WifiOff className="w-3 h-3" />
                切断
              </div>
            )}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={connect}
              disabled={isConnected}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              接続
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={disconnect}
              disabled={!isConnected}
            >
              切断
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? '▼' : '▶'} 詳細
            </Button>
          </div>

          {isExpanded && (
            <div className="space-y-2 text-xs">
              <div>
                <div className="font-medium text-muted-foreground">接続状態:</div>
                <div className={isConnected ? "text-green-600" : "text-red-600"}>
                  {isConnected ? "WebSocket接続済み (ws://localhost:8080)" : "WebSocket切断中"}
                </div>
              </div>

              {lastCommand && (
                <div>
                  <div className="font-medium text-muted-foreground">最新コマンド:</div>
                  <div className="bg-muted p-2 rounded text-xs font-mono">
                    <div>操作: {lastCommand.operation || lastCommand.type}</div>
                    <div>時刻: {new Date(lastCommand.timestamp).toLocaleTimeString()}</div>
                    {lastCommand.message && (
                      <div>メッセージ: {lastCommand.message}</div>
                    )}
                  </div>
                </div>
              )}

              <div className="text-muted-foreground">
                💡 エージェントからのUI操作命令をリアルタイムで受信・実行します
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 