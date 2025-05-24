// src/types/common.ts
// 共通型定義 - Phase 5A統合で重複を解消
// 複数ファイルで重複している基本的な型をここに集約

// =============================================================================
// 📐 座標・位置関連
// =============================================================================

/** 2D座標を表す基本的なPoint型 */
export interface Point {
  x: number;
  y: number;
}

/** 矩形領域を表す型 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// =============================================================================
// 🔌 WebSocket・ストリーム関連
// =============================================================================

/** WebSocketストリーム情報の共通型 */
export interface StreamInfo {
  ws: WebSocket;
  listeners: Set<(...args: any[]) => void>;
  refs: number;
  pingTimer?: NodeJS.Timeout;
  retryCount: number;
  reconnectTimer?: NodeJS.Timeout;
  keepAlive?: NodeJS.Timeout;
  closingTimer?: NodeJS.Timeout;
  directConnection?: boolean;
}

/** WebSocketリスナー関数の型 */
export type Listener = (data: unknown) => void;

// =============================================================================
// 🎯 UI操作関連
// =============================================================================

/** UI操作のタイプ */
export type UIOperationType = 
  | 'change_symbol' 
  | 'change_timeframe' 
  | 'change_theme' 
  | 'toggle_indicator'
  | 'set_drawing_mode'
  | 'clear_drawings'
  | 'save_chart'
  | 'reset_zoom';

/** UI操作を表す統一型 */
export interface UIOperation {
  type: UIOperationType;
  payload: Record<string, any>;
  description: string;
  timestamp?: string;
  source?: string;
}

// =============================================================================
// 🔧 ユーティリティ型
// =============================================================================

/** 非同期操作の結果型 */
export interface AsyncResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
}

/** 汎用的なキー・値ペア */
export interface KeyValuePair<T = any> {
  key: string;
  value: T;
}

/** ページネーション情報 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// =============================================================================
// 📊 Chart・ウィンドウ関連
// =============================================================================

/** チャート機能が拡張されたWindow型 */
export interface WindowWithChart extends Window {
  __getChartElement?: () => HTMLElement;
  __chartInstance?: any; // IChartApiの代わりにanyを使用（循環import回避）
}

// =============================================================================
// 🧠 MASTRA Memory・ストレージ関連
// =============================================================================

/** MASTRA メッセージ型 */
export interface MastraMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  threadId?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

/** MASTRA ストレージドキュメント型 */
export interface StorageDocument {
  id: string;
  content: string;
  embedding?: number[];
  metadata: Record<string, any>;
  timestamp: string;
  threadId?: string;
  resourceId?: string;
}

/** MASTRA 検索結果型 */
export interface SearchResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  score: number;
  timestamp: string;
}

/** MASTRA セマンティック検索オプション型 */
export interface SemanticSearchOptions {
  topK?: number;
  threshold?: number;
  threadId?: string;
  resourceId?: string;
}

/** MASTRA メモリオプション型 */
export interface MemoryOptions {
  lastMessages?: number;
  semanticRecall?: {
    topK: number;
    messageRange: number;
  };
} 