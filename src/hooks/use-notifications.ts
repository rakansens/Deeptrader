// 🎯 通知システム管理フック（DB連携版）
// 作成日: 2025/1/25
// 更新内容: notificationsテーブルとの統合・リアルタイム通知

"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase";
import { logger } from "@/lib/logger";
import type { Database } from "@/types/supabase";

type Notification = Database['public']['Tables']['notifications']['Row'];
type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];
type NotificationType = Notification['type'];

interface NotificationStats {
  total_count: number;
  unread_count: number;
  priority_high_count: number;
  latest_notification_id: string | null;
}

interface UseNotifications {
  notifications: Notification[];
  stats: NotificationStats | null;
  isLoading: boolean;
  error: string | null;
  
  // 通知作成
  createNotification: (notification: Omit<NotificationInsert, 'user_id'>) => Promise<boolean>;
  
  // 通知操作
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  dismissNotification: (notificationId: string) => Promise<boolean>;
  deleteNotification: (notificationId: string) => Promise<boolean>;
  
  // 通知取得
  refreshNotifications: () => Promise<void>;
  getNotificationsByType: (type: NotificationType) => Notification[];
  getUnreadNotifications: () => Notification[];
  
  // クリーンアップ
  cleanupExpiredNotifications: () => Promise<boolean>;
}

export function useNotifications(): UseNotifications {
  const supabase = createClient();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 通知データを取得
  const fetchNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNotifications([]);
        setStats(null);
        return;
      }

      // 通知一覧を取得（未削除の通知のみ）
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (notificationsError) {
        throw new Error(`通知取得エラー: ${notificationsError.message}`);
      }

      // 統計情報を取得
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_notification_stats', { target_user_id: user.id });

      if (statsError) {
        logger.warn('[useNotifications] 統計取得エラー:', statsError);
      }

      setNotifications(notificationsData || []);
      setStats(statsData?.[0] || null);
      setError(null);

    } catch (error) {
      logger.error('[useNotifications] 通知取得エラー:', error);
      setError(error instanceof Error ? error.message : '通知の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // 初回ロード
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // リアルタイム通知の監視
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // リアルタイム購読設定
      const channel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            logger.info('[useNotifications] リアルタイム通知:', payload);
            
            // 通知データを再取得（シンプルな方法）
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };
    
    setupRealtimeSubscription();
  }, [supabase, fetchNotifications]);

  // 通知作成
  const createNotification = useCallback(async (
    notification: Omit<NotificationInsert, 'user_id'>
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('ログインが必要です');
      }

      const { error } = await supabase
        .from('notifications')
        .insert({
          ...notification,
          user_id: user.id
        });

      if (error) {
        throw new Error(`通知作成エラー: ${error.message}`);
      }

      logger.info('[useNotifications] 通知作成成功');
      await fetchNotifications(); // 即座に更新
      return true;

    } catch (error) {
      logger.error('[useNotifications] 通知作成エラー:', error);
      setError(error instanceof Error ? error.message : '通知の作成に失敗しました');
      return false;
    }
  }, [supabase, fetchNotifications]);

  // 既読にする
  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        throw new Error(`既読更新エラー: ${error.message}`);
      }

      // ローカル状態も更新
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        )
      );

      return true;

    } catch (error) {
      logger.error('[useNotifications] 既読更新エラー:', error);
      setError(error instanceof Error ? error.message : '既読更新に失敗しました');
      return false;
    }
  }, [supabase]);

  // 全て既読にする
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        throw new Error(`一括既読エラー: ${error.message}`);
      }

      await fetchNotifications(); // 統計も更新
      return true;

    } catch (error) {
      logger.error('[useNotifications] 一括既読エラー:', error);
      setError(error instanceof Error ? error.message : '一括既読に失敗しました');
      return false;
    }
  }, [supabase, fetchNotifications]);

  // 通知を削除（非表示）
  const dismissNotification = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_dismissed: true })
        .eq('id', notificationId);

      if (error) {
        throw new Error(`通知削除エラー: ${error.message}`);
      }

      // ローカル状態から除去
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
      return true;

    } catch (error) {
      logger.error('[useNotifications] 通知削除エラー:', error);
      setError(error instanceof Error ? error.message : '通知削除に失敗しました');
      return false;
    }
  }, [supabase]);

  // 通知を完全削除
  const deleteNotification = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        throw new Error(`通知完全削除エラー: ${error.message}`);
      }

      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
      return true;

    } catch (error) {
      logger.error('[useNotifications] 通知完全削除エラー:', error);
      setError(error instanceof Error ? error.message : '通知削除に失敗しました');
      return false;
    }
  }, [supabase]);

  // タイプ別通知取得
  const getNotificationsByType = useCallback((type: NotificationType): Notification[] => {
    return notifications.filter(notification => notification.type === type);
  }, [notifications]);

  // 未読通知取得
  const getUnreadNotifications = useCallback((): Notification[] => {
    return notifications.filter(notification => !notification.is_read);
  }, [notifications]);

  // 期限切れ通知のクリーンアップ
  const cleanupExpiredNotifications = useCallback(async (): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('cleanup_expired_notifications');

      if (error) {
        throw new Error(`クリーンアップエラー: ${error.message}`);
      }

      await fetchNotifications(); // データを再取得
      return true;

    } catch (error) {
      logger.error('[useNotifications] クリーンアップエラー:', error);
      return false;
    }
  }, [supabase, fetchNotifications]);

  return {
    notifications,
    stats,
    isLoading,
    error,
    createNotification,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    deleteNotification,
    refreshNotifications: fetchNotifications,
    getNotificationsByType,
    getUnreadNotifications,
    cleanupExpiredNotifications
  };
} 