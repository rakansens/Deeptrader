// src/constants/index.ts
// 定数統一エクスポート - Phase 5B整理後

// チャート関連定数
export * from './chart';

// ネットワーク関連定数
export * from './network';

// タイムアウト・遅延関連定数
export * from './timeouts';

// UI・チャート関連定数
export * from './ui';

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
  LOCAL_WS_URL,
  CHAT_API_ENDPOINT,
  DEFAULT_API_LIMIT,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_ERROR,
} from './network';

export {
  // タイムアウト関連
  HTTP_FETCH_TIMEOUT,
  WS_PING_INTERVAL,
  TOAST_REMOVE_DELAY,
} from './timeouts';

export {
  // UI関連
  DEFAULT_STROKE_WIDTH,
  DEFAULT_ORDERBOOK_DEPTH,
  GUEST_USER_ID,
} from './ui'; 