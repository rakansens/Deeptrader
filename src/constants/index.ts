// src/constants/index.ts
// 定数統一エクスポート - Phase 5B Constants集約

// チャート関連定数
export * from './chart';

// ネットワーク・WebSocket関連定数
export * from './network';

// 再エクスポート（よく使用される定数の短縮アクセス）
export {
  // チャート関連
  DEFAULT_INDICATOR_SETTINGS,
  TIMEFRAMES,
  SYMBOLS,
  TIMEFRAME_TO_MS,
} from './chart';

export {
  // ネットワーク関連
  UI_COMMAND_WS_PORT,
  WS_PING_INTERVAL,
  HTTP_FETCH_TIMEOUT,
  CHAT_API_ENDPOINT,
  GUEST_USER_ID,
} from './network'; 