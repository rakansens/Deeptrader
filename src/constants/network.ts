// src/constants/network.ts
// ネットワーク・WebSocket関連定数集約 - Phase 5B Constants集約

// =============================================================================
// 🔌 WebSocket関連定数
// =============================================================================

/** UIコマンド WebSocketサーバーポート */
export const UI_COMMAND_WS_PORT = 8080;

/** WebSocket Hub サーバーポート */
export const WS_HUB_PORT = 8080;

/** WebSocket ping間隔（ミリ秒） */
export const WS_PING_INTERVAL = 30_000; // 30秒

/** WebSocket 最大再接続遅延（ミリ秒） */
export const WS_MAX_RECONNECT_DELAY = 30_000; // 30秒

/** WebSocket 接続遅延時間（ミリ秒） */
export const WS_CLOSE_DELAY = 5_000; // 5秒

// =============================================================================
// ⏱️ タイムアウト関連定数
// =============================================================================

/** HTTP fetch タイムアウト（ミリ秒） */
export const HTTP_FETCH_TIMEOUT = 5_000; // 5秒

/** UI操作 fetch タイムアウト（ミリ秒） */
export const UI_OPERATION_TIMEOUT = 3_000; // 3秒

/** Toastメッセージ削除遅延（ミリ秒） */
export const TOAST_REMOVE_DELAY = 5_000; // 5秒

/** スクリーンショット通知表示時間（ミリ秒） */
export const SCREENSHOT_TOAST_DURATION = 5_000; // 5秒

/** チャートデータ保存間隔（ミリ秒） */
export const CHART_SAVE_INTERVAL = 5_000; // 5秒

// =============================================================================
// 🌐 デフォルトURL・エンドポイント
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
// 🔢 その他システム定数
// =============================================================================

/** ゲストユーザー UUID */
export const GUEST_USER_ID = '00000000-0000-0000-0000-000000000000';

/** デフォルト精度（浮動小数点比較用） */
export const DEFAULT_PRECISION = 6;

// =============================================================================
// 🌐 API・HTTP関連定数
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

/** 再接続基本遅延時間（ミリ秒） */
export const RECONNECT_BASE_DELAY = 1000; // 1秒

// =============================================================================
// ⚡ WebSocketレート制限関連
// =============================================================================

/** WebSocketストリーム固有レート制限期間（ミリ秒） */
export const WS_RATE_LIMIT_STREAM_SPECIFIC = 100; // 100ms

/** WebSocket通常レート制限期間（ミリ秒） */
export const WS_RATE_LIMIT_NORMAL = 200; // 200ms

/** WebSocketレディステート: OPEN */
export const WS_READY_STATE_OPEN = 1;

// =============================================================================
// 🎨 UI・チャート関連定数
// =============================================================================

/** デフォルト描画線幅 */
export const DEFAULT_STROKE_WIDTH = 2;

/** デフォルト消しゴムサイズ */
export const DEFAULT_ERASER_SIZE = 30;

/** チャートキャプチャスケール */
export const CHART_CAPTURE_SCALE = 1.5;

/** オーダーブックデフォルト深度 */
export const DEFAULT_ORDERBOOK_DEPTH = 20;

/** リトライカウント初期値 */
export const INITIAL_RETRY_COUNT = 0; 