// src/components/chart/UICommandConsole.tsx
// UI操作WebSocket接続状態表示コンソール（改良版）
'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Terminal, Wifi, WifiOff } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export function UICommandConsole() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>('UI制御システム待機中...');
  const [isExpanded, setIsExpanded] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connectWebSocket = () => {
    try {
      setLastMessage('WebSocket接続を試行中...');
      const ws = new WebSocket('ws://127.0.0.1:8080');
      wsRef.current = ws;
      
      ws.onopen = () => {
        setIsConnected(true);
        setConnectionAttempts(0);
        setLastMessage('WebSocket接続成功 (ws://127.0.0.1:8080)');
        console.log('✅ UICommandConsole: WebSocket接続成功');
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.operation) {
            setLastMessage(`UI操作受信: ${data.operation}`);
            console.log('📥 UICommandConsole: UI操作受信', data);
          } else if (data.message) {
            setLastMessage(`メッセージ: ${data.message}`);
          }
        } catch (error) {
          setLastMessage('WebSocketメッセージ受信');
        }
      };
      
      ws.onclose = () => {
        setIsConnected(false);
        setLastMessage('WebSocket接続切断 - 再接続を試行中...');
        console.log('❌ UICommandConsole: WebSocket接続切断');
        
        // 自動再接続（5秒後）
        if (connectionAttempts < 10) {
          reconnectTimeoutRef.current = setTimeout(() => {
            setConnectionAttempts(prev => prev + 1);
            connectWebSocket();
          }, 5000);
        } else {
          setLastMessage('WebSocket再接続試行回数上限に達しました');
        }
      };
      
      ws.onerror = (error) => {
        setIsConnected(false);
        setLastMessage('WebSocket接続エラー');
        console.log('⚠️ UICommandConsole: WebSocket接続エラー', error);
      };
      
    } catch (error) {
      setIsConnected(false);
      setLastMessage('WebSocket接続失敗');
      console.log('❌ UICommandConsole: WebSocket接続失敗', error);
    }
  };

  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleManualReconnect = () => {
    setConnectionAttempts(0);
    connectWebSocket();
  };

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
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? '▼' : '▶'} 詳細
            </Button>
            {!isConnected && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleManualReconnect}
              >
                再接続
              </Button>
            )}
          </div>

          {isExpanded && (
            <div className="space-y-2 text-xs">
              <div>
                <div className="font-medium text-muted-foreground">接続状態:</div>
                <div className={isConnected ? "text-green-600" : "text-red-600"}>
                  {isConnected ? "WebSocket接続済み (ws://127.0.0.1:8080)" : "WebSocket切断中"}
                </div>
              </div>

              <div>
                <div className="font-medium text-muted-foreground">ステータス:</div>
                <div className="bg-muted p-2 rounded text-xs font-mono">
                  {lastMessage}
                </div>
              </div>

              {connectionAttempts > 0 && (
                <div>
                  <div className="font-medium text-muted-foreground">再接続試行:</div>
                  <div className="text-orange-600">
                    {connectionAttempts}/10 回
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