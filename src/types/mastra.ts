// src/types/mastra.ts
// MASTRA Memory・ストレージ関連型定義 - Phase 5B分離
// common.tsから分離して専門化

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