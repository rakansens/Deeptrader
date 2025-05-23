// src/hooks/useUICommandWebSocket.ts
// フロントエンド用UI操作WebSocketクライアントフック
'use client';

import { useEffect, useRef, useState } from 'react';
import { logger } from '@/lib/logger';
import type { Timeframe } from '@/constants/chart';

interface UICommand {
  id: string;
  type: 'ui_operation' | 'connection_established';
  operation?: string;
  payload?: Record<string, any>;
  timestamp: string;
  message?: string;
}

export function useUICommandWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastCommand, setLastCommand] = useState<UICommand | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket接続
  const connect = () => {
    try {
      const ws = new WebSocket('ws://localhost:8080');
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        logger.info('UI Command WebSocket接続完了');
      };

      ws.onmessage = (event) => {
        try {
          const command: UICommand = JSON.parse(event.data);
          setLastCommand(command);

          if (command.type === 'ui_operation' && command.operation && command.payload) {
            executeUICommand(command.operation, command.payload);
          }
        } catch (error) {
          logger.error('WebSocketメッセージ解析エラー:', error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        logger.warn('UI Command WebSocket切断');
        
        // 自動再接続（5秒後）
        reconnectTimeoutRef.current = setTimeout(() => {
          logger.info('WebSocket自動再接続試行');
          connect();
        }, 5000);
      };

      ws.onerror = (error) => {
        logger.error('UI Command WebSocketエラー:', error);
        setIsConnected(false);
      };

    } catch (error) {
      logger.error('WebSocket接続エラー:', error);
    }
  };

  // UI操作実行（UiControlContext無しでも動作）
  const executeUICommand = (operation: string, payload: Record<string, any>) => {
    try {
      logger.info(`UI操作実行: ${operation}`, payload);

      switch (operation) {
        case 'change_timeframe':
          if (payload.timeframe) {
            // グローバルイベントでタイムフレーム変更を通知
            window.dispatchEvent(new CustomEvent('timeframeChange', { 
              detail: { timeframe: payload.timeframe as Timeframe } 
            }));
            logger.info(`タイムフレーム変更実行: ${payload.timeframe}`);
          }
          break;

        case 'toggle_indicator':
          if (payload.indicator) {
            // グローバルイベントでインジケーター切り替えを通知
            window.dispatchEvent(new CustomEvent('indicatorToggle', { 
              detail: { indicator: payload.indicator, enabled: payload.enabled } 
            }));
            logger.info(`インジケーター切り替え実行: ${payload.indicator} = ${payload.enabled}`);
          }
          break;

        case 'change_theme':
          // テーマ変更ロジック
          if (payload.theme) {
            document.documentElement.setAttribute('data-theme', payload.theme);
            logger.info(`テーマ変更実行: ${payload.theme}`);
          }
          break;

        case 'change_symbol':
          // 銘柄変更ロジック
          if (payload.symbol) {
            window.dispatchEvent(new CustomEvent('symbolChange', { 
              detail: { symbol: payload.symbol } 
            }));
            logger.info(`銘柄変更実行: ${payload.symbol}`);
          }
          break;

        case 'zoom_chart':
          // チャートズームロジック
          if (payload.action) {
            window.dispatchEvent(new CustomEvent('chartZoom', { 
              detail: { action: payload.action, factor: payload.factor } 
            }));
            logger.info(`チャートズーム実行: ${payload.action}`);
          }
          break;

        default:
          logger.warn(`未知のUI操作: ${operation}`);
          break;
      }
    } catch (error) {
      logger.error(`UI操作実行エラー (${operation}):`, error);
    }
  };

  // 手動切断
  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  };

  // 自動接続（コンポーネントマウント時）
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    lastCommand,
    connect,
    disconnect,
  };
} 