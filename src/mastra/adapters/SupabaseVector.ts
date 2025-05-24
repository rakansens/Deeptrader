// src/mastra/adapters/SupabaseVector.ts
// Supabase + pgvectorを使用したMastra完全ストレージアダプタ
// MASTRA v0.10 MastraStorage インターフェース完全実装 + Phase 5A型統合

import { createServiceRoleClient } from "@/utils/supabase/server-entry";
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';
import type { Json, MastraMessage, StorageDocument, SearchResult, SemanticSearchOptions, MemoryOptions } from '@/types';

/**
 * MASTRA v0.10 完全対応 SupabaseVector ストレージアダプター
 * 
 * 機能:
 * - メッセージの永続化
 * - セマンティック検索
 * - スレッド管理
 * - リソース管理
 * - メタデータ検索
 */
export class SupabaseVectorStorage {
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

  // 📝 メッセージ保存
  async saveMessage(message: MastraMessage): Promise<void> {
    try {
      const client = await this.getClient();
      
      const record = {
        id: message.id || uuidv4(),
        user_id: message.resourceId || 'system',
        thread_id: message.threadId || 'default',
        role: message.role,
        content: message.content,
        metadata: message.metadata || {},
        created_at: message.timestamp || new Date().toISOString(),
      };

      const { error } = await client
        .from('mastra_messages')
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

  // 📖 メッセージ取得
  async getMessages(
    threadId?: string,
    resourceId?: string,
    limit?: number
  ): Promise<MastraMessage[]> {
    try {
      const client = await this.getClient();
      
      let query = client
        .from('mastra_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (threadId) {
        query = query.eq('thread_id', threadId);
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
        role: record.role,
        content: record.content,
        timestamp: record.created_at,
        threadId: record.thread_id,
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

  // 🔍 セマンティック検索（ベクトル検索）
  async semanticSearch(
    embedding: number[],
    options: SemanticSearchOptions = {}
  ): Promise<SearchResult[]> {
    try {
      const client = await this.getClient();
      
      const {
        topK = this.options.semanticRecall?.topK || 5,
        threshold = 0.7,
        threadId,
        resourceId,
      } = options;

      // ベクトル検索用RPC呼び出し
      const { data, error } = await client.rpc('mastra_semantic_search', {
        query_embedding: embedding,
        match_threshold: threshold,
        match_count: topK,
        thread_id: threadId,
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
        timestamp: item.created_at,
      }));

      logger.debug(`セマンティック検索成功: ${results.length}件`);
      return results;
    } catch (err) {
      logger.error('セマンティック検索例外:', err);
      return [];
    }
  }

  // 📄 ドキュメント保存（エンベディング付き）
  async saveDocument(doc: StorageDocument): Promise<void> {
    try {
      const client = await this.getClient();
      
      const record = {
        id: doc.id || uuidv4(),
        user_id: doc.resourceId || 'system',
        thread_id: doc.threadId || 'default',
        content: doc.content,
        embedding: doc.embedding || null,
        metadata: doc.metadata || {},
        created_at: doc.timestamp || new Date().toISOString(),
      };

      const { error } = await client
        .from('mastra_vectors')
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
        .from('mastra_messages')
        .delete()
        .eq('thread_id', threadId);

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
      
      // メッセージ数
      let messageQuery = client
        .from('mastra_messages')
        .select('*', { count: 'exact', head: true });
      
      if (resourceId) {
        messageQuery = messageQuery.eq('user_id', resourceId);
      }

      const { count: messageCount, error: messageError } = await messageQuery;

      // スレッド数
      let threadQuery = client
        .from('mastra_messages')
        .select('thread_id', { count: 'exact', head: true });
      
      if (resourceId) {
        threadQuery = threadQuery.eq('user_id', resourceId);
      }

      const { count: threadCount, error: threadError } = await threadQuery;

      // ベクトル数
      let vectorQuery = client
        .from('mastra_vectors')
        .select('*', { count: 'exact', head: true });
      
      if (resourceId) {
        vectorQuery = vectorQuery.eq('user_id', resourceId);
      }

      const { count: vectorCount, error: vectorError } = await vectorQuery;

      const stats = {
        messageCount: messageCount || 0,
        threadCount: threadCount || 0,
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
      const { error } = await client.from('mastra_messages').select('id').limit(1);
      return !error;
    } catch (err) {
      logger.error('ヘルスチェック失敗:', err);
      return false;
    }
  }
}

// 🔄 後方互換性のため既存インターフェースを維持
export const SupabaseVector = {
  async add(docs: any[]): Promise<void> {
    const storage = new SupabaseVectorStorage();
    for (const doc of docs) {
      await storage.saveDocument({
        id: doc.id || uuidv4(),
        content: doc.content || '',
        embedding: doc.embedding,
        metadata: doc.metadata || {},
        timestamp: new Date().toISOString(),
      });
    }
  },

  async search(embedding: number[], topK = 5): Promise<any[]> {
    const storage = new SupabaseVectorStorage();
    const results = await storage.semanticSearch(embedding, { topK });
    return results.map(result => ({
      id: result.id,
      content: result.content,
      metadata: result.metadata,
      score: result.score,
    }));
  },
};

// 🚀 完全実装をエクスポート
export default SupabaseVectorStorage; 