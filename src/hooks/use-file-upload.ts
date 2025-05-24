// 🎯 ファイルアップロード管理フック（DB連携版）
// 作成日: 2025/1/25
// 更新内容: uploaded_filesテーブルとの統合

"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/utils/supabase";
import { logger } from "@/lib/logger";
import type { Database } from "@/types/supabase";

type UploadedFile = Database['public']['Tables']['uploaded_files']['Row'];
type FileInsert = Database['public']['Tables']['uploaded_files']['Insert'];
type FileType = UploadedFile['file_type'];

interface UploadResult {
  success: boolean;
  file?: UploadedFile;
  error?: string;
}

interface UseFileUpload {
  uploadFile: (file: File, fileType: FileType, bucket?: string) => Promise<UploadResult>;
  deleteFile: (fileId: string) => Promise<boolean>;
  getUserFiles: (fileType?: FileType) => Promise<UploadedFile[]>;
  getActiveUserAvatar: (isUser: boolean) => Promise<UploadedFile | null>;
  isUploading: boolean;
  error: string | null;
}

export function useFileUpload(): UseFileUpload {
  const supabase = createClient();
  
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ファイルアップロード処理
  const uploadFile = useCallback(async (
    file: File, 
    fileType: FileType, 
    bucket: string = 'avatars'
  ): Promise<UploadResult> => {
    setIsUploading(true);
    setError(null);
    
    try {
      // ユーザー認証確認
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('ログインが必要です');
      }

      // ファイル名を生成（重複防止）
      const ext = file.name.split('.').pop() || 'unknown';
      const timestamp = Date.now();
      const fileName = `${fileType}_${user.id}_${timestamp}.${ext}`;
      const storagePath = `${user.id}/${fileName}`;
      
      // ファイルサイズチェック（10MB制限）
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('ファイルサイズが10MBを超えています');
      }
      
      // Supabaseストレージにアップロード
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (uploadError) {
        throw new Error(`アップロードエラー: ${uploadError.message}`);
      }
      
      // 公開URLを取得
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(storagePath);
        
      const publicUrl = urlData.publicUrl;
      
      // メタデータ準備
      const metadata: any = {
        originalSize: file.size,
        uploadedAt: new Date().toISOString()
      };
      
      // 画像の場合は追加メタデータを取得
      if (file.type.startsWith('image/')) {
        try {
          const img = new Image();
          const imageMetadata = await new Promise<{width: number, height: number}>((resolve) => {
            img.onload = () => resolve({ width: img.width, height: img.height });
            img.src = URL.createObjectURL(file);
          });
          metadata.dimensions = imageMetadata;
        } catch (e) {
          logger.warn('[useFileUpload] 画像メタデータ取得失敗:', e);
        }
      }
      
      // アバターの場合は古いファイルを非アクティブ化
      if (fileType === 'avatar_user' || fileType === 'avatar_assistant') {
        await supabase
          .from('uploaded_files')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .eq('file_type', fileType)
          .eq('is_active', true);
      }
      
      // データベースにファイル情報を保存
      const fileData: FileInsert = {
        user_id: user.id,
        file_name: fileName,
        original_name: file.name,
        file_type: fileType,
        file_size: file.size,
        mime_type: file.type,
        storage_bucket: bucket,
        storage_path: storagePath,
        public_url: publicUrl,
        is_active: true,
        metadata
      };
      
      const { data: insertedFile, error: dbError } = await supabase
        .from('uploaded_files')
        .insert(fileData)
        .select()
        .single();
        
      if (dbError) {
        // DBエラーの場合はストレージからファイルを削除
        await supabase.storage.from(bucket).remove([storagePath]);
        throw new Error(`データベースエラー: ${dbError.message}`);
      }
      
      logger.info('[useFileUpload] ファイルアップロード成功:', insertedFile);
      
      return {
        success: true,
        file: insertedFile
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'アップロードに失敗しました';
      setError(errorMessage);
      logger.error('[useFileUpload] アップロードエラー:', error);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsUploading(false);
    }
  }, [supabase]);

  // ファイル削除処理
  const deleteFile = useCallback(async (fileId: string): Promise<boolean> => {
    try {
      // ファイル情報を取得
      const { data: file, error: fetchError } = await supabase
        .from('uploaded_files')
        .select('*')
        .eq('id', fileId)
        .single();
        
      if (fetchError || !file) {
        throw new Error('ファイルが見つかりません');
      }
      
      // ストレージからファイルを削除
      const { error: storageError } = await supabase.storage
        .from(file.storage_bucket)
        .remove([file.storage_path]);
        
      if (storageError) {
        logger.warn('[useFileUpload] ストレージ削除警告:', storageError);
      }
      
      // データベースからレコードを削除
      const { error: dbError } = await supabase
        .from('uploaded_files')
        .delete()
        .eq('id', fileId);
        
      if (dbError) {
        throw new Error(`削除エラー: ${dbError.message}`);
      }
      
      logger.info('[useFileUpload] ファイル削除成功:', fileId);
      return true;
      
    } catch (error) {
      logger.error('[useFileUpload] 削除エラー:', error);
      setError(error instanceof Error ? error.message : 'ファイル削除に失敗しました');
      return false;
    }
  }, [supabase]);

  // ユーザーのファイル一覧取得
  const getUserFiles = useCallback(async (fileType?: FileType): Promise<UploadedFile[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      let query = supabase
        .from('uploaded_files')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
        
      if (fileType) {
        query = query.eq('file_type', fileType);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`ファイル取得エラー: ${error.message}`);
      }
      
      return data || [];
      
    } catch (error) {
      logger.error('[useFileUpload] ファイル取得エラー:', error);
      setError(error instanceof Error ? error.message : 'ファイル取得に失敗しました');
      return [];
    }
  }, [supabase]);

  // アクティブなユーザーアバターを取得
  const getActiveUserAvatar = useCallback(async (isUser: boolean): Promise<UploadedFile | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const fileType = isUser ? 'avatar_user' : 'avatar_assistant';
      
      const { data, error } = await supabase
        .from('uploaded_files')
        .select('*')
        .eq('user_id', user.id)
        .eq('file_type', fileType)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (error) {
        throw new Error(`アバター取得エラー: ${error.message}`);
      }
      
      return data;
      
    } catch (error) {
      logger.error('[useFileUpload] アバター取得エラー:', error);
      return null;
    }
  }, [supabase]);

  return {
    uploadFile,
    deleteFile,
    getUserFiles,
    getActiveUserAvatar,
    isUploading,
    error
  };
} 