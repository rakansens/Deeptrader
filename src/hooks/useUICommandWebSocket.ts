// src/hooks/useUICommandWebSocket.ts
// フロントエンド用UI操作WebSocketクライアントフック
'use client';

import { useEffect, useRef, useState } from 'react';
import { logger } from '@/lib/logger';
import type { Timeframe } from '@/constants/chart';
import { LOCAL_WS_URL } from '@/constants/network';
import { WS_CLOSE_DELAY } from '@/constants/timeouts';

export interface UICommand {
  type: string;
  operation?: string;
  payload?: Record<string, any>;
  timestamp: number;
}

export const useUICommandWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<UICommand | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    try {
      // if (ws.current?.readyState === WebSocket.OPEN) return;
      
      ws.current = new WebSocket(LOCAL_WS_URL);

      ws.current.onopen = () => {
        setIsConnected(true);
        logger.info('UI Command WebSocket接続完了');
      };

      ws.current.onmessage = (event) => {
        try {
          const command: UICommand = JSON.parse(event.data);
          setLastMessage(command);

          if (command.type === 'ui_operation' && command.operation && command.payload) {
            executeUICommand(command.operation, command.payload);
          }
        } catch (error) {
          logger.error('WebSocketメッセージ解析エラー:', error);
        }
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        ws.current = null;
        logger.warn('UI Command WebSocket切断');
        
        // 自動再接続（5秒後）
        reconnectTimeout.current = setTimeout(() => {
          logger.info('WebSocket自動再接続試行');
          connect();
        }, WS_CLOSE_DELAY);
      };

      ws.current.onerror = (error) => {
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
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }

    if (ws.current) {
      ws.current.close();
      ws.current = null;
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
    lastMessage,
    connect,
    disconnect,
  };
}; 