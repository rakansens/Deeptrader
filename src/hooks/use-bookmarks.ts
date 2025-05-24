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
import { safeGetJson, safeSetJson } from '@/lib/local-storage-utils';
import { getCurrentISOTimestamp, isoToUnixTimestamp, unixToISOTimestamp } from '@/lib/date-utils';
import { isEmptyArray, isNonEmptyArray, hasItems, hasText } from '@/lib/validation-utils';

type DBBookmark = Database['public']['Tables']['bookmarks']['Row'];
type DBBookmarkInsert = Database['public']['Tables']['bookmarks']['Insert'];
type DBBookmarkUpdate = Database['public']['Tables']['bookmarks']['Update'];
type DBBookmarkCategory = Database['public']['Tables']['bookmark_categories']['Row'];

interface UseBookmarks {
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
  searchBookmarks: (query: string) => Bookmark[];
  filterBookmarks: (filter: BookmarkFilter) => Bookmark[];
  
  // ユーティリティ
  isBookmarked: (messageId: string) => boolean;
  getBookmarkByMessageId: (messageId: string) => Bookmark | undefined;
  getBookmarksByCategory: (categoryId: string) => Bookmark[];
  getBookmarksByTag: (tag: string) => Bookmark[];
  
  // カテゴリ管理
  addCategory: (category: Omit<BookmarkCategory, 'id'>) => void;
  updateCategory: (categoryId: string, updates: Partial<BookmarkCategory>) => void;
  
  // エクスポート・インポート
  exportBookmarks: () => string;
  importBookmarks: (data: string) => Promise<void>;
  
  // 統計
  getStats: () => {
    total: number;
    byCategory: Record<string, number>;
    topTags: Array<{ tag: string; count: number }>;
  };
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

export function useBookmarks(): UseBookmarks {
  const supabase = createClient();
  
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [categories, setCategories] = useState<BookmarkCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ブックマークデータを取得
  const fetchBookmarks = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setBookmarks([]);
        return;
      }

      // ブックマーク一覧を取得（カテゴリとタグも同時取得）
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

      // データ変換
      const convertedBookmarks = (bookmarksData || []).map((item: any) => {
        const category = item.bookmark_categories ? convertDBCategoryToApp(item.bookmark_categories) : null;
        const tags = (item.bookmark_tags || []).map((tag: any) => tag.tag_name);
        return convertDBBookmarkToApp(item, category, tags);
      });

      setBookmarks(convertedBookmarks);
      setError(null);

    } catch (error) {
      logger.error('[useBookmarks] ブックマーク取得エラー:', error);
      setError(error instanceof Error ? error.message : 'ブックマークの取得に失敗しました');
    }
  }, [supabase]);

  // カテゴリデータを取得
  const fetchCategories = useCallback(async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('bookmark_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (categoriesError) {
        throw new Error(`カテゴリ取得エラー: ${categoriesError.message}`);
      }

      const convertedCategories = (categoriesData || []).map(convertDBCategoryToApp);
      setCategories(convertedCategories);

    } catch (error) {
      logger.error('[useBookmarks] カテゴリ取得エラー:', error);
      // カテゴリ取得失敗時はデフォルトカテゴリを使用
      setCategories([...DEFAULT_BOOKMARK_CATEGORIES]);
    }
  }, [supabase]);

  // localStorage移行機能
  const migrateFromLocalStorage = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const STORAGE_KEY = 'chat_bookmarks';
      const storedBookmarks = localStorage.getItem(STORAGE_KEY);
      
      if (!storedBookmarks) {
        logger.info('[useBookmarks] localStorage移行: データなし');
        return;
      }

      const oldBookmarks = JSON.parse(storedBookmarks) as Bookmark[];
      if (isEmptyArray(oldBookmarks)) {
        logger.info('[useBookmarks] localStorage移行: 空データ');
        return;
      }

      logger.info(`[useBookmarks] localStorage移行開始: ${oldBookmarks.length}件`);

      // 既存データがある場合は移行しない
      if (isNonEmptyArray(bookmarks)) {
        logger.info('[useBookmarks] 既存データがあるため移行をスキップ');
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
      
      logger.info('[useBookmarks] localStorage移行完了');
      await fetchBookmarks(); // データ再取得

    } catch (error) {
      logger.error('[useBookmarks] localStorage移行エラー:', error);
    }
  }, [supabase, bookmarks, categories, fetchBookmarks]);

  // 初回ロード
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([
        fetchCategories(),
        fetchBookmarks()
      ]);
      setLoading(false);
      
      // 初回ロード後にlocalStorage移行を実行
      await migrateFromLocalStorage();
    };

    initializeData();
  }, [fetchCategories, fetchBookmarks, migrateFromLocalStorage]);

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
            logger.info('[useBookmarks] ブックマークリアルタイム更新:', payload);
            fetchBookmarks();
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
            logger.info('[useBookmarks] タグリアルタイム更新:', payload);
            fetchBookmarks();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(bookmarksChannel);
      };
    };
    
    setupRealtimeSubscription();
  }, [supabase, fetchBookmarks]);

  // ブックマーク追加
  const addBookmark = useCallback(async (
    message: Message,
    conversationId: string,
    category: BookmarkCategory,
    title?: string,
    tags: string[] = []
  ) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('ログインが必要です');
      }

      // ブックマーク本体を作成
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
          logger.warn('[useBookmarks] タグ作成エラー:', tagsError);
        }
      }

      logger.info('[useBookmarks] ブックマーク作成成功');
      await fetchBookmarks(); // データ再取得
      setError(null);

    } catch (error) {
      logger.error('[useBookmarks] ブックマーク追加エラー:', error);
      setError(error instanceof Error ? error.message : 'ブックマークの追加に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [supabase, fetchBookmarks]);

  // ブックマーク削除
  const removeBookmark = useCallback(async (bookmarkId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId);

      if (error) {
        throw new Error(`ブックマーク削除エラー: ${error.message}`);
      }

      await fetchBookmarks();
      setError(null);

    } catch (error) {
      logger.error('[useBookmarks] ブックマーク削除エラー:', error);
      setError(error instanceof Error ? error.message : 'ブックマークの削除に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [supabase, fetchBookmarks]);

  // ブックマーク更新
  const updateBookmark = useCallback(async (bookmarkId: string, updates: Partial<Bookmark>) => {
    setLoading(true);
    try {
      // アプリ型からDB型への変換
      const dbUpdates: DBBookmarkUpdate = {};
      
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.isStarred !== undefined) dbUpdates.is_starred = updates.isStarred;
      if (updates.category) dbUpdates.category_id = updates.category.id;

      // updated_atを設定
      dbUpdates.updated_at = getCurrentISOTimestamp();

      const { error: updateError } = await supabase
        .from('bookmarks')
        .update(dbUpdates)
        .eq('id', bookmarkId);

      if (updateError) throw updateError;

      if (updates.tags !== undefined) {
        // 既存タグを削除
        await supabase
          .from('bookmark_tags')
          .delete()
          .eq('bookmark_id', bookmarkId);

        // 新しいタグを追加
        if (hasItems(updates.tags)) {
          const tagInserts = updates.tags.map(tag => ({
            bookmark_id: bookmarkId,
            tag_name: tag,
          }));

          const { error: tagsError } = await supabase
            .from('bookmark_tags')
            .insert(tagInserts);

          if (tagsError) {
            logger.warn('[useBookmarks] タグ更新エラー:', tagsError);
          }
        }
      }

      await fetchBookmarks();
      setError(null);

    } catch (error) {
      logger.error('[useBookmarks] ブックマーク更新エラー:', error);
      setError(error instanceof Error ? error.message : 'ブックマークの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [supabase, fetchBookmarks]);

  // スター切り替え
  const toggleStar = useCallback(async (bookmarkId: string) => {
    const bookmark = bookmarks.find(b => b.id === bookmarkId);
    if (bookmark) {
      await updateBookmark(bookmarkId, { isStarred: !bookmark.isStarred });
    }
  }, [bookmarks, updateBookmark]);

  // 検索（同期版、互換性のため）
  const searchBookmarks = useCallback((query: string): Bookmark[] => {
    if (!hasText(query)) return bookmarks;
    
    const lowerQuery = query.toLowerCase();
    return bookmarks.filter(bookmark => 
      bookmark.title.toLowerCase().includes(lowerQuery) ||
      bookmark.messageContent.toLowerCase().includes(lowerQuery) ||
      bookmark.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      bookmark.category.name.toLowerCase().includes(lowerQuery)
    );
  }, [bookmarks]);

  // フィルタ（同期版、互換性のため）
  const filterBookmarks = useCallback((filter: BookmarkFilter): Bookmark[] => {
    let filtered = bookmarks;

    if (filter.category) {
      filtered = filtered.filter(b => b.category.id === filter.category);
    }

    if (filter.isStarred !== undefined) {
      filtered = filtered.filter(b => b.isStarred === filter.isStarred);
    }

    if (filter.messageRole) {
      filtered = filtered.filter(b => b.messageRole === filter.messageRole);
    }

    if (hasItems(filter.tags)) {
      filtered = filtered.filter(b => 
        filter.tags!.some(tag => b.tags.includes(tag))
      );
    }

    if (filter.dateRange) {
      filtered = filtered.filter(b => 
        b.createdAt >= filter.dateRange!.start && 
        b.createdAt <= filter.dateRange!.end
      );
    }

    if (filter.searchQuery) {
      filtered = searchBookmarks(filter.searchQuery);
    }

    return filtered;
  }, [bookmarks, searchBookmarks]);

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

  // カテゴリ管理（同期版、互換性のため）
  const addCategory = useCallback((categoryData: Omit<BookmarkCategory, 'id'>) => {
    // 非同期処理を同期APIでラップ
    (async () => {
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

        await fetchCategories();

      } catch (error) {
        logger.error('[useBookmarks] カテゴリ追加エラー:', error);
        setError(error instanceof Error ? error.message : 'カテゴリの追加に失敗しました');
      }
    })();
  }, [supabase, fetchCategories]);

  const updateCategory = useCallback((categoryId: string, updates: Partial<BookmarkCategory>) => {
    // 非同期処理を同期APIでラップ
    (async () => {
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

        await fetchCategories();

      } catch (error) {
        logger.error('[useBookmarks] カテゴリ更新エラー:', error);
        setError(error instanceof Error ? error.message : 'カテゴリの更新に失敗しました');
      }
    })();
  }, [supabase, fetchCategories]);

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
        logger.warn('[useBookmarks] インポート機能は今後実装予定');
        throw new Error('インポート機能は今後実装予定です');
      }
    } catch (err) {
      throw new Error('インポートデータの形式が正しくありません');
    }
  }, []);

  // 統計
  const getStats = useCallback(() => {
    const byCategory: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};

    bookmarks.forEach(bookmark => {
      // カテゴリ別統計
      const categoryId = bookmark.category.id;
      byCategory[categoryId] = (byCategory[categoryId] || 0) + 1;

      // タグ別統計
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
  }, [bookmarks]);

  return {
    bookmarks,
    categories,
    loading,
    error,
    
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
    
    getStats
  };
} 