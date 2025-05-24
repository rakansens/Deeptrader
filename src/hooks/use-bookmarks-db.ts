// 📚 ブックマーク管理フック（DB版）
// 作成日: 2025/1/25
// 更新内容: localStorage → Supabase移行、リアルタイム同期対応
// Phase 6B-1: 非同期状態管理統合

"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from "@/utils/supabase";
import { logger } from "@/lib/logger";
import type { Database } from "@/types/supabase";
import type { 
  Bookmark, 
  BookmarkCategory, 
  BookmarkFilter
} from '@/types/bookmark';
import { DEFAULT_BOOKMARK_CATEGORIES } from '@/types/bookmark';
import { Message } from '@/types/chat';
import { getCurrentISOTimestamp, isoToUnixTimestamp, unixToISOTimestamp } from '@/lib/date-utils';
import { isEmptyArray, isNonEmptyArray, hasItems, hasText } from '@/lib/validation-utils';
import { useAsyncState, useAsyncOperations } from '@/hooks/use-async-state';

type DBBookmark = Database['public']['Tables']['bookmarks']['Row'];
type DBBookmarkInsert = Database['public']['Tables']['bookmarks']['Insert'];
type DBBookmarkUpdate = Database['public']['Tables']['bookmarks']['Update'];
type DBBookmarkCategory = Database['public']['Tables']['bookmark_categories']['Row'];
type DBBookmarkTag = Database['public']['Tables']['bookmark_tags']['Row'];

interface UseBookmarksDB {
  bookmarks: Bookmark[];
  categories: BookmarkCategory[];
  loading: boolean;
  error: string | null;
  
  // ブックマーク操作
  addBookmark: (message: Message, conversationId: string, category: BookmarkCategory, title?: string, tags?: string[]) => Promise<void>;
  removeBookmark: (bookmarkId: string) => Promise<void>;
  updateBookmark: (bookmarkId: string, updates: Partial<Bookmark>) => Promise<void>;
  toggleStar: (bookmarkId: string) => Promise<void>;
  
  // 検索・フィルタ
  searchBookmarks: (query: string) => Promise<Bookmark[]>;
  filterBookmarks: (filter: BookmarkFilter) => Promise<Bookmark[]>;
  
  // ユーティリティ
  isBookmarked: (messageId: string) => boolean;
  getBookmarkByMessageId: (messageId: string) => Bookmark | undefined;
  getBookmarksByCategory: (categoryId: string) => Bookmark[];
  getBookmarksByTag: (tag: string) => Bookmark[];
  
  // カテゴリ管理
  addCategory: (category: Omit<BookmarkCategory, 'id'>) => Promise<void>;
  updateCategory: (categoryId: string, updates: Partial<BookmarkCategory>) => Promise<void>;
  
  // エクスポート・インポート
  exportBookmarks: () => string;
  importBookmarks: (data: string) => Promise<void>;
  
  // 統計
  getStats: () => Promise<{
    total: number;
    byCategory: Record<string, number>;
    topTags: Array<{ tag: string; count: number }>;
  }>;
  
  // localStorage移行
  migrateFromLocalStorage: () => Promise<void>;
}

// DB → アプリ型変換
function convertDBBookmarkToApp(
  dbBookmark: DBBookmark,
  category: BookmarkCategory | null,
  tags: string[]
): Bookmark {
  return {
    id: dbBookmark.id,
    messageId: dbBookmark.message_id,
    conversationId: dbBookmark.conversation_id || '',
    title: dbBookmark.title,
    description: dbBookmark.description || undefined,
    category: category || { 
      id: 'general', 
      name: '一般', 
      color: 'bg-gray-500', 
      icon: 'Bookmark',
      description: 'その他の重要な情報'
    },
    tags,
    isStarred: dbBookmark.is_starred || false,
    createdAt: isoToUnixTimestamp(dbBookmark.created_at!),
    updatedAt: isoToUnixTimestamp(dbBookmark.updated_at!),
    messageContent: dbBookmark.message_content,
    messageRole: dbBookmark.message_role as 'user' | 'assistant',
    messageTimestamp: isoToUnixTimestamp(dbBookmark.message_timestamp),
  };
}

// DB → アプリカテゴリ型変換
function convertDBCategoryToApp(dbCategory: DBBookmarkCategory): BookmarkCategory {
  return {
    id: dbCategory.id,
    name: dbCategory.name,
    color: dbCategory.color,
    icon: dbCategory.icon,
    description: dbCategory.description || undefined,
  };
}

export function useBookmarksDB(): UseBookmarksDB {
  const supabase = createClient();
  
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [categories, setCategories] = useState<BookmarkCategory[]>([]);

  // 統合Hook使用: ブックマークフェッチ
  const bookmarksState = useAsyncState(
    async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setBookmarks([]);
        return [];
      }

      const { data: bookmarksData, error: bookmarksError } = await supabase
        .from('bookmarks')
        .select(`
          *,
          bookmark_categories (
            id, name, color, icon, description
          ),
          bookmark_tags (
            tag_name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (bookmarksError) {
        throw new Error(`ブックマーク取得エラー: ${bookmarksError.message}`);
      }

      const convertedBookmarks = (bookmarksData || []).map((item: any) => {
        const category = item.bookmark_categories ? convertDBCategoryToApp(item.bookmark_categories) : null;
        const tags = (item.bookmark_tags || []).map((tag: any) => tag.tag_name);
        return convertDBBookmarkToApp(item, category, tags);
      });

      setBookmarks(convertedBookmarks);
      return convertedBookmarks;
    },
    [supabase],
    { 
      initialData: [],
      autoExecute: true,
      onError: (error) => {
        logger.error('[useBookmarksDB] ブックマーク取得エラー:', error);
      }
    }
  );

  // 統合Hook使用: カテゴリフェッチ
  const categoriesState = useAsyncState(
    async () => {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('bookmark_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (categoriesError) {
        throw new Error(`カテゴリ取得エラー: ${categoriesError.message}`);
      }

      const convertedCategories = (categoriesData || []).map(convertDBCategoryToApp);
      setCategories(convertedCategories);
      return convertedCategories;
    },
    [supabase],
    {
      initialData: [],
      autoExecute: true,
      onError: (error) => {
        logger.error('[useBookmarksDB] カテゴリ取得エラー:', error);
        setCategories([...DEFAULT_BOOKMARK_CATEGORIES]);
      }
    }
  );

  // 統合Hook使用: 非同期操作
  const operations = useAsyncOperations({
    // ブックマーク追加
    addBookmark: async ({ message, conversationId, category, title, tags = [] }: {
      message: Message;
      conversationId: string;
      category: BookmarkCategory;
      title?: string;
      tags?: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('ログインが必要です');
      }

      const bookmarkData: DBBookmarkInsert = {
        user_id: user.id,
        message_id: message.id,
        conversation_id: conversationId,
        category_id: category.id,
        title: title || message.content.slice(0, 50) + (message.content.length > 50 ? '...' : ''),
        description: undefined,
        is_starred: false,
        message_content: message.content,
        message_role: message.role,
        message_timestamp: unixToISOTimestamp(message.timestamp),
      };

      const { data: createdBookmark, error: bookmarkError } = await supabase
        .from('bookmarks')
        .insert(bookmarkData)
        .select()
        .single();

      if (bookmarkError) {
        throw new Error(`ブックマーク作成エラー: ${bookmarkError.message}`);
      }

      // タグがある場合は追加
      if (hasItems(tags) && createdBookmark) {
        const tagInserts = tags.map(tag => ({
          bookmark_id: createdBookmark.id,
          tag_name: tag,
        }));

        const { error: tagsError } = await supabase
          .from('bookmark_tags')
          .insert(tagInserts);

        if (tagsError) {
          logger.warn('[useBookmarksDB] タグ作成エラー:', tagsError);
        }
      }

      logger.info('[useBookmarksDB] ブックマーク作成成功');
      await bookmarksState.execute(); // データ再取得
    },

    // ブックマーク削除
    removeBookmark: async (bookmarkId: string) => {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId);

      if (error) {
        throw new Error(`ブックマーク削除エラー: ${error.message}`);
      }

      await bookmarksState.execute();
    },

    // ブックマーク更新
    updateBookmark: async ({ bookmarkId, updates }: {
      bookmarkId: string;
      updates: Partial<Bookmark>;
    }) => {
      const dbUpdates: DBBookmarkUpdate = {};
      
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.isStarred !== undefined) dbUpdates.is_starred = updates.isStarred;
      if (updates.category) dbUpdates.category_id = updates.category.id;

      const { error } = await supabase
        .from('bookmarks')
        .update(dbUpdates)
        .eq('id', bookmarkId);

      if (error) {
        throw new Error(`ブックマーク更新エラー: ${error.message}`);
      }

      // タグ更新
      if (updates.tags !== undefined) {
        await supabase
          .from('bookmark_tags')
          .delete()
          .eq('bookmark_id', bookmarkId);

        if (hasItems(updates.tags)) {
          const tagInserts = updates.tags.map(tag => ({
            bookmark_id: bookmarkId,
            tag_name: tag,
          }));

          const { error: tagsError } = await supabase
            .from('bookmark_tags')
            .insert(tagInserts);

          if (tagsError) {
            logger.warn('[useBookmarksDB] タグ更新エラー:', tagsError);
          }
        }
      }

      await bookmarksState.execute();
    }
  });

  // リアルタイム購読設定
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const bookmarksChannel = supabase
        .channel('bookmarks-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookmarks',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            logger.info('[useBookmarksDB] ブックマークリアルタイム更新:', payload);
            bookmarksState.execute();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookmark_tags',
          },
          (payload) => {
            logger.info('[useBookmarksDB] タグリアルタイム更新:', payload);
            bookmarksState.execute();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(bookmarksChannel);
      };
    };
    
    setupRealtimeSubscription();
  }, [supabase, bookmarksState]);

  // 統合されたインターフェース実装
  const addBookmark = useCallback(async (
    message: Message,
    conversationId: string,
    category: BookmarkCategory,
    title?: string,
    tags?: string[]
  ) => {
    await operations.addBookmark.execute({ message, conversationId, category, title, tags });
  }, [operations.addBookmark]);

  const removeBookmark = useCallback(async (bookmarkId: string) => {
    await operations.removeBookmark.execute(bookmarkId);
  }, [operations.removeBookmark]);

  const updateBookmark = useCallback(async (bookmarkId: string, updates: Partial<Bookmark>) => {
    await operations.updateBookmark.execute({ bookmarkId, updates });
  }, [operations.updateBookmark]);

  const toggleStar = useCallback(async (bookmarkId: string) => {
    const bookmark = bookmarks.find(b => b.id === bookmarkId);
    if (bookmark) {
      await updateBookmark(bookmarkId, { isStarred: !bookmark.isStarred });
    }
  }, [bookmarks, updateBookmark]);

  // 検索（データベース検索）
  const searchBookmarks = useCallback(async (query: string): Promise<Bookmark[]> => {
    if (!hasText(query)) return bookmarks;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .rpc('search_bookmarks', {
          target_user_id: user.id,
          search_query: query,
          result_limit: 100
        });

      if (error) {
        logger.error('[useBookmarksDB] 検索エラー:', error);
        return bookmarks.filter(bookmark => 
          bookmark.title.toLowerCase().includes(query.toLowerCase()) ||
          bookmark.messageContent.toLowerCase().includes(query.toLowerCase())
        );
      }

      // 結果をアプリ型に変換
      return (data || []).map((item: any) => ({
        id: item.bookmark_id,
        messageId: '', 
        conversationId: '',
        title: item.title,
        description: item.description,
        category: {
          id: '',
          name: item.category_name,
          color: item.category_color,
          icon: item.category_icon,
        },
        tags: item.tags || [],
        isStarred: item.is_starred,
        createdAt: isoToUnixTimestamp(item.created_at),
        updatedAt: isoToUnixTimestamp(item.updated_at),
        messageContent: item.message_content,
        messageRole: item.message_role as 'user' | 'assistant',
        messageTimestamp: 0,
      }));

    } catch (error) {
      logger.error('[useBookmarksDB] 検索処理エラー:', error);
      return [];
    }
  }, [supabase, bookmarks]);

  // フィルタ（簡易版維持）
  const filterBookmarks = useCallback(async (filter: BookmarkFilter): Promise<Bookmark[]> => {
    // 既存実装を維持
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .rpc('search_bookmarks', {
          target_user_id: user.id,
          search_query: filter.searchQuery || null,
          category_filter: filter.category || null,
          starred_filter: filter.isStarred || null,
          role_filter: filter.messageRole || null,
          tag_filter: filter.tags?.join(',') || null,
          result_limit: 100
        });

      if (error) {
        logger.error('[useBookmarksDB] フィルタエラー:', error);
        return bookmarks;
      }

      // 結果をアプリ型に変換（簡易版）
      return (data || []).map((item: any) => ({
        id: item.bookmark_id,
        messageId: '',
        conversationId: '',
        title: item.title,
        description: item.description,
        category: {
          id: '',
          name: item.category_name,
          color: item.category_color,
          icon: item.category_icon,
        },
        tags: item.tags || [],
        isStarred: item.is_starred,
        createdAt: isoToUnixTimestamp(item.created_at),
        updatedAt: isoToUnixTimestamp(item.updated_at),
        messageContent: item.message_content,
        messageRole: item.message_role as 'user' | 'assistant',
        messageTimestamp: 0,
      }));

    } catch (error) {
      logger.error('[useBookmarksDB] フィルタ処理エラー:', error);
      return [];
    }
  }, [supabase, bookmarks]);

  // ユーティリティ関数
  const isBookmarked = useCallback((messageId: string): boolean => {
    return bookmarks.some(b => b.messageId === messageId);
  }, [bookmarks]);

  const getBookmarkByMessageId = useCallback((messageId: string): Bookmark | undefined => {
    return bookmarks.find(b => b.messageId === messageId);
  }, [bookmarks]);

  const getBookmarksByCategory = useCallback((categoryId: string): Bookmark[] => {
    return bookmarks.filter(b => b.category.id === categoryId);
  }, [bookmarks]);

  const getBookmarksByTag = useCallback((tag: string): Bookmark[] => {
    return bookmarks.filter(b => b.tags.includes(tag));
  }, [bookmarks]);

  // カテゴリ管理（簡易版維持）
  const addCategory = useCallback(async (categoryData: Omit<BookmarkCategory, 'id'>) => {
    try {
      const { error } = await supabase
        .from('bookmark_categories')
        .insert({
          name: categoryData.name,
          color: categoryData.color,
          icon: categoryData.icon,
          description: categoryData.description,
          is_default: false,
        });

      if (error) {
        throw new Error(`カテゴリ作成エラー: ${error.message}`);
      }

      await categoriesState.execute();

    } catch (error) {
      logger.error('[useBookmarksDB] カテゴリ追加エラー:', error);
      categoriesState.setError(error instanceof Error ? error.message : 'カテゴリの追加に失敗しました');
    }
  }, [supabase, categoriesState]);

  const updateCategory = useCallback(async (categoryId: string, updates: Partial<BookmarkCategory>) => {
    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
      if (updates.description !== undefined) dbUpdates.description = updates.description;

      const { error } = await supabase
        .from('bookmark_categories')
        .update(dbUpdates)
        .eq('id', categoryId);

      if (error) {
        throw new Error(`カテゴリ更新エラー: ${error.message}`);
      }

      await categoriesState.execute();

    } catch (error) {
      logger.error('[useBookmarksDB] カテゴリ更新エラー:', error);
      categoriesState.setError(error instanceof Error ? error.message : 'カテゴリの更新に失敗しました');
    }
  }, [supabase, categoriesState]);

  // エクスポート
  const exportBookmarks = useCallback((): string => {
    const exportData = {
      bookmarks,
      categories,
      exportedAt: Date.now(),
      version: '2.0-db'
    };
    return JSON.stringify(exportData, null, 2);
  }, [bookmarks, categories]);

  // インポート（簡易版）
  const importBookmarks = useCallback(async (data: string) => {
    try {
      const importData = JSON.parse(data);
      if (importData.bookmarks && Array.isArray(importData.bookmarks)) {
        // TODO: バッチインポート機能の実装
        logger.warn('[useBookmarksDB] インポート機能は今後実装予定');
        throw new Error('インポート機能は今後実装予定です');
      }
    } catch (err) {
      throw new Error('インポートデータの形式が正しくありません');
    }
  }, []);

  // 統計取得（簡易版維持）
  const getStats = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { total: 0, byCategory: {}, topTags: [] };
      }

      const { data, error } = await supabase
        .rpc('get_bookmark_stats', { target_user_id: user.id });

      if (error) {
        logger.error('[useBookmarksDB] 統計取得エラー:', error);
        // フォールバック
        const byCategory: Record<string, number> = {};
        const tagCounts: Record<string, number> = {};

        bookmarks.forEach(bookmark => {
          const categoryId = bookmark.category.id;
          byCategory[categoryId] = (byCategory[categoryId] || 0) + 1;

          bookmark.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        });

        const topTags = Object.entries(tagCounts)
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        return {
          total: bookmarks.length,
          byCategory,
          topTags
        };
      }

      const stats = data?.[0];
      return {
        total: Number(stats?.total_bookmarks || 0),
        byCategory: {},
        topTags: (stats?.top_tags || []).map((tag: string, index: number) => ({
          tag,
          count: 10 - index
        }))
      };

    } catch (error) {
      logger.error('[useBookmarksDB] 統計処理エラー:', error);
      return { total: 0, byCategory: {}, topTags: [] };
    }
  }, [supabase, bookmarks]);

  // localStorage移行機能（簡易版維持）
  const migrateFromLocalStorage = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const STORAGE_KEY = 'chat_bookmarks';
      const storedBookmarks = localStorage.getItem(STORAGE_KEY);
      
      if (!storedBookmarks) {
        logger.info('[useBookmarksDB] localStorage移行: データなし');
        return;
      }

      const oldBookmarks = JSON.parse(storedBookmarks) as Bookmark[];
      if (isEmptyArray(oldBookmarks)) {
        logger.info('[useBookmarksDB] localStorage移行: 空データ');
        return;
      }

      logger.info(`[useBookmarksDB] localStorage移行開始: ${oldBookmarks.length}件`);

      // 既存データがある場合は移行しない
      if (isNonEmptyArray(bookmarks)) {
        logger.info('[useBookmarksDB] 既存データがあるため移行をスキップ');
        return;
      }

      // バッチ移行
      for (const oldBookmark of oldBookmarks) {
        try {
          const category = categories.find(c => c.id === oldBookmark.category.id) || categories[0];
          
          const bookmarkData: DBBookmarkInsert = {
            user_id: user.id,
            message_id: oldBookmark.messageId,
            conversation_id: oldBookmark.conversationId,
            category_id: category.id,
            title: oldBookmark.title,
            description: oldBookmark.description,
            is_starred: oldBookmark.isStarred,
            message_content: oldBookmark.messageContent,
            message_role: oldBookmark.messageRole,
            message_timestamp: unixToISOTimestamp(oldBookmark.messageTimestamp),
          };

          const { data: createdBookmark, error: bookmarkError } = await supabase
            .from('bookmarks')
            .insert(bookmarkData)
            .select()
            .single();

          if (bookmarkError) {
            logger.error(`ブックマーク移行エラー [${oldBookmark.id}]:`, bookmarkError);
            continue;
          }

          // タグ移行
          if (hasItems(oldBookmark.tags) && createdBookmark) {
            const tagInserts = oldBookmark.tags.map(tag => ({
              bookmark_id: createdBookmark.id,
              tag_name: tag,
            }));

            const { error: tagsError } = await supabase
              .from('bookmark_tags')
              .insert(tagInserts);

            if (tagsError) {
              logger.warn(`タグ移行エラー [${oldBookmark.id}]:`, tagsError);
            }
          }

        } catch (error) {
          logger.error(`個別ブックマーク移行エラー [${oldBookmark.id}]:`, error);
        }
      }

      // 移行完了後はlocalStorageをクリア
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('bookmark_categories');
      
      logger.info('[useBookmarksDB] localStorage移行完了');
      await bookmarksState.execute();

    } catch (error) {
      logger.error('[useBookmarksDB] localStorage移行エラー:', error);
    }
  }, [supabase, bookmarks, categories, bookmarksState]);

  // 統合された返り値
  return {
    bookmarks,
    categories,
    loading: bookmarksState.loading || categoriesState.loading || 
            operations.addBookmark.loading || operations.removeBookmark.loading || 
            operations.updateBookmark.loading,
    error: bookmarksState.error || categoriesState.error || 
          operations.addBookmark.error || operations.removeBookmark.error || 
          operations.updateBookmark.error,
    
    addBookmark,
    removeBookmark,
    updateBookmark,
    toggleStar,
    
    searchBookmarks,
    filterBookmarks,
    
    isBookmarked,
    getBookmarkByMessageId,
    getBookmarksByCategory,
    getBookmarksByTag,
    
    addCategory,
    updateCategory,
    
    exportBookmarks,
    importBookmarks,
    
    getStats,
    migrateFromLocalStorage
  };
}