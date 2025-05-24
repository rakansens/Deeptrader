// src/constants/network.ts
// ネットワーク・HTTP・API関連定数 - Phase 5B整理後

// =============================================================================
// 🔌 WebSocket関連
// =============================================================================

/** UIコマンド WebSocketサーバーポート */
export const UI_COMMAND_WS_PORT = 8080;

/** WebSocket Hub サーバーポート */
export const WS_HUB_PORT = 8080;

/** WebSocketレディステート: OPEN */
export const WS_READY_STATE_OPEN = 1;

// =============================================================================
// 🌐 URL・エンドポイント
// =============================================================================

/** ローカル WebSocket URL */
export const LOCAL_WS_URL = 'ws://localhost:8080';

/** ローカル UI操作 API URL */
export const LOCAL_UI_API_URL = 'http://127.0.0.1:8080';

/** Binance WebSocket URL（デフォルト） */
export const DEFAULT_BINANCE_WS_URL = 'wss://stream.binance.com:9443';

// =============================================================================
// 📡 内部API エンドポイント
// =============================================================================

/** チャット API エンドポイント */
export const CHAT_API_ENDPOINT = '/api/chat';

/** 画像アップロード API エンドポイント */
export const UPLOAD_API_ENDPOINT = '/api/upload';

/** 画像分析 API エンドポイント */
export const IMAGE_ANALYSIS_API_ENDPOINT = '/api/image-analysis';

/** チャートスクリーンショット API エンドポイント */
export const CHART_SCREENSHOT_API_ENDPOINT = '/api/chart-screenshot';

/** チャート分析 API エンドポイント */
export const CHART_ANALYSIS_API_ENDPOINT = '/api/chart-analysis';

// =============================================================================
// 🌐 API・HTTP関連
// =============================================================================

/** APIクエリ制限: デフォルト */
export const DEFAULT_API_LIMIT = 100;

/** APIクエリ制限: 小 */
export const SMALL_API_LIMIT = 20;

/** HTTPステータスコード: Bad Request */
export const HTTP_STATUS_BAD_REQUEST = 400;

/** HTTPステータスコード: Internal Server Error */
export const HTTP_STATUS_INTERNAL_ERROR = 500;

/** 最大リトライ回数 */
export const MAX_RETRY_COUNT = 5; 