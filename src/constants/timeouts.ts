// src/constants/timeouts.ts
// タイムアウト・遅延・間隔関連定数 - Phase 5B整理

// =============================================================================
// ⏱️ ネットワークタイムアウト
// =============================================================================

/** HTTP fetch タイムアウト（ミリ秒） */
export const HTTP_FETCH_TIMEOUT = 5_000; // 5秒

/** UI操作 fetch タイムアウト（ミリ秒） */
export const UI_OPERATION_TIMEOUT = 3_000; // 3秒

/** WebSocket 接続遅延時間（ミリ秒） */
export const WS_CLOSE_DELAY = 5_000; // 5秒

/** WebSocket ping間隔（ミリ秒） */
export const WS_PING_INTERVAL = 30_000; // 30秒

/** WebSocket 最大再接続遅延（ミリ秒） */
export const WS_MAX_RECONNECT_DELAY = 30_000; // 30秒

/** 再接続基本遅延時間（ミリ秒） */
export const RECONNECT_BASE_DELAY = 1000; // 1秒

// =============================================================================
// 🎯 UIタイムアウト・表示時間
// =============================================================================

/** Toastメッセージ削除遅延（ミリ秒） */
export const TOAST_REMOVE_DELAY = 5_000; // 5秒

/** スクリーンショット通知表示時間（ミリ秒） */
export const SCREENSHOT_TOAST_DURATION = 5_000; // 5秒

/** チャートデータ保存間隔（ミリ秒） */
export const CHART_SAVE_INTERVAL = 5_000; // 5秒

// =============================================================================
// ⚡ レート制限期間
// =============================================================================

/** WebSocketストリーム固有レート制限期間（ミリ秒） */
export const WS_RATE_LIMIT_STREAM_SPECIFIC = 100; // 100ms

/** WebSocket通常レート制限期間（ミリ秒） */
export const WS_RATE_LIMIT_NORMAL = 200; // 200ms 