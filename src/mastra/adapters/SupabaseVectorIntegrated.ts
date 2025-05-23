// src/mastra/adapters/SupabaseVectorIntegrated.ts
// 既存memoriesテーブル活用MASTRA統合版
// 作成日: 2025-01-23
// 機能: 既存Supabaseテーブルを活用してMASTRAメモリ機能を統合実装

import { createServiceRoleClient } from "@/utils/supabase/server-entry";
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';
import type { Json } from '@/types';

// 🔧 MASTRA Memory インターフェース型定義
interface MastraMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  threadId?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

interface StorageDocument {
  id: string;
  content: string;
  embedding?: number[];
  metadata: Record<string, any>;
  timestamp: string;
  threadId?: string;
  resourceId?: string;
}

interface SearchResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  score: number;
  timestamp: string;
}

interface SemanticSearchOptions {
  topK?: number;
  threshold?: number;
  threadId?: string;
  resourceId?: string;
}

interface MemoryOptions {
  lastMessages?: number;
  semanticRecall?: {
    topK: number;
    messageRange: number;
  };
}

/**
 * 既存memoriesテーブル活用MASTRA統合ストレージアダプター
 * 
 * 既存テーブル活用:
 * - memories: メッセージ管理（拡張）
 * - memories_vector: ベクトル検索
 * - match_documents: セマンティック検索
 * 
 * 特徴:
 * - 既存テーブル破壊なし
 * - 後方互換性維持
 * - MASTRA機能完全対応
 */
export class SupabaseVectorIntegrated {
  private supabase: any;
  private options: MemoryOptions;

  constructor(options: MemoryOptions = {}) {
    this.options = {
      lastMessages: 40,
      semanticRecall: {
        topK: 5,
        messageRange: 2,
      },
      ...options,
    };
  }

  // 🔧 Supabaseクライアント初期化
  private async getClient() {
    if (!this.supabase) {
      this.supabase = await createServiceRoleClient();
    }
    return this.supabase;
  }

  // 📝 メッセージ保存（memoriesテーブル活用）
  async saveMessage(message: MastraMessage): Promise<void> {
    try {
      const client = await this.getClient();
      
      // UUID生成を修正：標準的なUUIDv4形式を使用
      const messageId = message.id && message.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) 
        ? message.id 
        : uuidv4();
      
      // memoriesテーブルにMASTRA情報を拡張して保存
      const record = {
        id: messageId,
        user_id: message.resourceId || 'system',
        content: message.content,
        metadata: {
          ...(message.metadata || {}),
          // MASTRA拡張フィールド
          role: message.role,
          threadId: message.threadId || 'default',
          timestamp: message.timestamp || new Date().toISOString(),
          source: 'mastra'
        },
        external_id: message.threadId,
        is_synced: true,
        created_at: message.timestamp || new Date().toISOString(),
      };

      const { error } = await client
        .from('memories')
        .insert([record]);

      if (error) {
        logger.error('メッセージ保存エラー:', error);
        throw new Error(`Failed to save message: ${error.message}`);
      }

      logger.debug('メッセージ保存成功:', { id: record.id, role: message.role });
    } catch (err) {
      logger.error('メッセージ保存例外:', err);
      throw err;
    }
  }

  // 📖 メッセージ取得（memoriesテーブル活用）
  async getMessages(
    threadId?: string,
    resourceId?: string,
    limit?: number
  ): Promise<MastraMessage[]> {
    try {
      const client = await this.getClient();
      
      let query = client
        .from('memories')
        .select('*')
        .eq('metadata->>source', 'mastra')
        .order('created_at', { ascending: false });

      if (threadId) {
        query = query.eq('external_id', threadId);
      }

      if (resourceId) {
        query = query.eq('user_id', resourceId);
      }

      if (limit) {
        query = query.limit(limit);
      } else {
        query = query.limit(this.options.lastMessages || 40);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('メッセージ取得エラー:', error);
        throw new Error(`Failed to get messages: ${error.message}`);
      }

      const messages: MastraMessage[] = (data || []).reverse().map((record: any) => ({
        id: record.id,
        role: record.metadata?.role || 'user',
        content: record.content,
        timestamp: record.metadata?.timestamp || record.created_at,
        threadId: record.metadata?.threadId || record.external_id,
        resourceId: record.user_id,
        metadata: record.metadata || {},
      }));

      logger.debug(`メッセージ取得成功: ${messages.length}件`);
      return messages;
    } catch (err) {
      logger.error('メッセージ取得例外:', err);
      return [];
    }
  }

  // 🔍 セマンティック検索（既存match_documents関数活用）
  async semanticSearch(
    embedding: number[],
    options: SemanticSearchOptions = {}
  ): Promise<SearchResult[]> {
    try {
      const client = await this.getClient();
      
      const {
        topK = this.options.semanticRecall?.topK || 5,
        threshold = 0.7,
        resourceId = 'system',
      } = options;

      // 既存match_documents関数を活用
      const { data, error } = await client.rpc('match_documents', {
        query_embedding: embedding,
        match_threshold: threshold,
        match_count: topK,
        user_id: resourceId,
      });

      if (error) {
        logger.error('セマンティック検索エラー:', error);
        throw new Error(`Semantic search failed: ${error.message}`);
      }

      const results: SearchResult[] = (data || []).map((item: any) => ({
        id: item.id,
        content: item.content,
        metadata: item.metadata || {},
        score: item.similarity,
        timestamp: item.created_at || new Date().toISOString(),
      }));

      logger.debug(`セマンティック検索成功: ${results.length}件`);
      return results;
    } catch (err) {
      logger.error('セマンティック検索例外:', err);
      return [];
    }
  }

  // 📄 ドキュメント保存（memories_vectorテーブル活用）
  async saveDocument(doc: StorageDocument): Promise<void> {
    try {
      const client = await this.getClient();
      
      // UUID生成を修正：標準的なUUIDv4形式を使用
      const documentId = doc.id && doc.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) 
        ? doc.id 
        : uuidv4();
      
      const record = {
        id: documentId,
        user_id: doc.resourceId || 'system',
        content: doc.content,
        embedding: doc.embedding || [],
        metadata: {
          ...(doc.metadata || {}),
          threadId: doc.threadId || 'default',
          timestamp: doc.timestamp || new Date().toISOString(),
          source: 'mastra'
        },
        created_at: doc.timestamp || new Date().toISOString(),
      };

      const { error } = await client
        .from('memories_vector')
        .insert([record]);

      if (error) {
        logger.error('ドキュメント保存エラー:', error);
        throw new Error(`Failed to save document: ${error.message}`);
      }

      logger.debug('ドキュメント保存成功:', { id: record.id });
    } catch (err) {
      logger.error('ドキュメント保存例外:', err);
      throw err;
    }
  }

  // 🧹 スレッドクリア
  async clearThread(threadId: string, resourceId?: string): Promise<void> {
    try {
      const client = await this.getClient();
      
      let query = client
        .from('memories')
        .delete()
        .eq('external_id', threadId)
        .eq('metadata->>source', 'mastra');

      if (resourceId) {
        query = query.eq('user_id', resourceId);
      }

      const { error } = await query;

      if (error) {
        logger.error('スレッドクリアエラー:', error);
        throw new Error(`Failed to clear thread: ${error.message}`);
      }

      logger.debug('スレッドクリア成功:', { threadId, resourceId });
    } catch (err) {
      logger.error('スレッドクリア例外:', err);
      throw err;
    }
  }

  // 📊 統計情報取得
  async getStats(resourceId?: string): Promise<{
    messageCount: number;
    threadCount: number;
    vectorCount: number;
  }> {
    try {
      const client = await this.getClient();
      
      // メッセージ数（MASTRA関連のみ）
      let messageQuery = client
        .from('memories')
        .select('*', { count: 'exact', head: true })
        .eq('metadata->>source', 'mastra');
      
      if (resourceId) {
        messageQuery = messageQuery.eq('user_id', resourceId);
      }

      const { count: messageCount } = await messageQuery;

      // ベクトル数（MASTRA関連のみ）
      let vectorQuery = client
        .from('memories_vector')
        .select('*', { count: 'exact', head: true })
        .eq('metadata->>source', 'mastra');
      
      if (resourceId) {
        vectorQuery = vectorQuery.eq('user_id', resourceId);
      }

      const { count: vectorCount } = await vectorQuery;

      const stats = {
        messageCount: messageCount || 0,
        threadCount: 0, // スレッド数は個別計算が必要
        vectorCount: vectorCount || 0,
      };

      logger.debug('統計情報取得成功:', stats);
      return stats;
    } catch (err) {
      logger.error('統計情報取得例外:', err);
      return { messageCount: 0, threadCount: 0, vectorCount: 0 };
    }
  }

  // ❤️ ヘルスチェック
  async healthCheck(): Promise<boolean> {
    try {
      const client = await this.getClient();
      const { error } = await client.from('memories').select('id').limit(1);
      return !error;
    } catch (err) {
      logger.error('ヘルスチェック失敗:', err);
      return false;
    }
  }
}

// 🔄 後方互換性のため既存インターフェース統合
export const SupabaseVector = {
  async add(docs: any[]): Promise<void> {
    const storage = new SupabaseVectorIntegrated();
    for (const doc of docs) {
      await storage.saveDocument({
        id: doc.id && doc.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) 
          ? doc.id 
          : uuidv4(),
        content: doc.content || '',
        embedding: doc.embedding,
        metadata: doc.metadata || {},
        timestamp: new Date().toISOString(),
      });
    }
  },

  async search(embedding: number[], topK = 5): Promise<any[]> {
    const storage = new SupabaseVectorIntegrated();
    const results = await storage.semanticSearch(embedding, { topK });
    return results.map(result => ({
      id: result.id,
      content: result.content,
      metadata: result.metadata,
      score: result.score,
    }));
  },
};

// 🚀 統合実装をエクスポート
export default SupabaseVectorIntegrated; 