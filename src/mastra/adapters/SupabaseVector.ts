// src/mastra/adapters/SupabaseVector.ts
// Supabase + pgvectorを使用したMastraベクトルストアアダプタ
// LibSQLVectorの代替として実装

import { createServiceRoleClient } from "@/utils/supabase/server-entry";
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';
import type { Json } from '@/types';

// ベクトルドキュメント型定義
interface VectorDocument {
  id?: string;
  content: string;
  embedding: number[];
  metadata?: Record<string, any>;
}

// 検索結果型
interface VectorSearchResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  score: number;
}

// Supabase検索結果型
interface SupabaseMatchResult {
  id: string;
  content: string;
  metadata: Json;
  similarity: number;
}

/**
 * Supabase + pgvector を使用したMastraベクトルストアアダプタ
 */
export const SupabaseVector = {
  /**
   * ドキュメントをベクトルストアに追加
   * @param docs エンベディング済みのドキュメント配列
   */
  async add(docs: VectorDocument[]): Promise<void> {
    try {
      // サービスロールクライアントを使用（認証不要）
      const supabase = await createServiceRoleClient();
      
      const formattedDocs = docs.map((doc: VectorDocument) => ({
        id: doc.id || uuidv4(),
        user_id: 'system', // システムユーザーとして保存
        content: doc.content || '',
        embedding: doc.embedding,
        metadata: doc.metadata || {},
        created_at: new Date().toISOString()
      }));
      
      // Supabaseにデータを挿入
      const { error } = await supabase.from('memories_vector').insert(formattedDocs);
      
      if (error) {
        logger.error('ベクトルストアへの保存に失敗:', error);
        throw new Error(`Failed to add documents to vector store: ${error.message}`);
      }
      
      logger.debug(`${formattedDocs.length}件のドキュメントをベクトルストアに保存しました`);
    } catch (err) {
      logger.error('ベクトルストア保存エラー:', err);
      throw err;
    }
  },
  
  /**
   * 類似ドキュメント検索
   * @param embedding 検索用のエンベディングベクトル
   * @param topK 取得する最大件数
   * @returns 類似度順にソートされたドキュメントの配列
   */
  async search(embedding: number[], topK = 5): Promise<VectorSearchResult[]> {
    try {
      // サービスロールクライアントを使用（認証不要）
      const supabase = await createServiceRoleClient();
      
      // match_documents RPCを呼び出し（全ユーザーのデータを検索）
      const { data, error } = await supabase.rpc('match_documents', {
        query_embedding: embedding,
        match_threshold: 0.7, // 類似度しきい値
        match_count: topK,
        user_id: null // 全ユーザーのデータを検索
      });
      
      if (error) {
        logger.error('ベクトル検索に失敗:', error);
        throw new Error(`Failed to search documents: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        logger.debug('ベクトル検索結果: 0件');
        return [];
      }
      
      logger.debug(`ベクトル検索結果: ${data.length}件`);
      
      // 結果をMastra形式に変換して返す
      return data.map((item: SupabaseMatchResult) => ({
        id: item.id,
        content: item.content,
        metadata: item.metadata ? (item.metadata as Record<string, any>) : {},
        score: item.similarity
      }));
    } catch (err) {
      logger.error('ベクトル検索エラー:', err);
      return []; // エラー時は空配列を返す
    }
  }
}; 