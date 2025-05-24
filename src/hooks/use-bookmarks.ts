import { useState, useEffect, useCallback } from 'react';
import { 
  Bookmark, 
  BookmarkCategory, 
  BookmarkFilter, 
  DEFAULT_BOOKMARK_CATEGORIES 
} from '@/types/bookmark';
import { Message } from '@/types/chat';

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

const STORAGE_KEY = 'chat_bookmarks';
const CATEGORIES_KEY = 'bookmark_categories';

export function useBookmarks(): UseBookmarks {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [categories, setCategories] = useState<BookmarkCategory[]>(DEFAULT_BOOKMARK_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初期化：localStorageからデータを読み込み
  useEffect(() => {
    try {
      const storedBookmarks = localStorage.getItem(STORAGE_KEY);
      const storedCategories = localStorage.getItem(CATEGORIES_KEY);
      
      if (storedBookmarks) {
        const parsedBookmarks = JSON.parse(storedBookmarks);
        setBookmarks(parsedBookmarks);
      }
      
      if (storedCategories) {
        const parsedCategories = JSON.parse(storedCategories);
        setCategories(parsedCategories);
      }
    } catch (err) {
      console.error('ブックマークの読み込みに失敗:', err);
      setError('ブックマークの読み込みに失敗しました');
    }
  }, []);

  // localStorageに保存
  const saveToStorage = useCallback((newBookmarks: Bookmark[], newCategories?: BookmarkCategory[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newBookmarks));
      if (newCategories) {
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(newCategories));
      }
    } catch (err) {
      console.error('ブックマークの保存に失敗:', err);
      setError('ブックマークの保存に失敗しました');
    }
  }, []);

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
      const bookmark: Bookmark = {
        id: crypto.randomUUID(),
        messageId: message.id,
        conversationId,
        title: title || message.content.slice(0, 50) + (message.content.length > 50 ? '...' : ''),
        category,
        tags,
        isStarred: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageContent: message.content,
        messageRole: message.role,
        messageTimestamp: message.timestamp
      };

      const newBookmarks = [...bookmarks, bookmark];
      setBookmarks(newBookmarks);
      saveToStorage(newBookmarks);
      setError(null);
    } catch (err) {
      console.error('ブックマーク追加エラー:', err);
      setError('ブックマークの追加に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [bookmarks, saveToStorage]);

  // ブックマーク削除
  const removeBookmark = useCallback(async (bookmarkId: string) => {
    setLoading(true);
    try {
      const newBookmarks = bookmarks.filter(b => b.id !== bookmarkId);
      setBookmarks(newBookmarks);
      saveToStorage(newBookmarks);
      setError(null);
    } catch (err) {
      console.error('ブックマーク削除エラー:', err);
      setError('ブックマークの削除に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [bookmarks, saveToStorage]);

  // ブックマーク更新
  const updateBookmark = useCallback(async (bookmarkId: string, updates: Partial<Bookmark>) => {
    setLoading(true);
    try {
      const newBookmarks = bookmarks.map(b => 
        b.id === bookmarkId 
          ? { ...b, ...updates, updatedAt: Date.now() }
          : b
      );
      setBookmarks(newBookmarks);
      saveToStorage(newBookmarks);
      setError(null);
    } catch (err) {
      console.error('ブックマーク更新エラー:', err);
      setError('ブックマークの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [bookmarks, saveToStorage]);

  // スター切り替え
  const toggleStar = useCallback(async (bookmarkId: string) => {
    const bookmark = bookmarks.find(b => b.id === bookmarkId);
    if (bookmark) {
      await updateBookmark(bookmarkId, { isStarred: !bookmark.isStarred });
    }
  }, [bookmarks, updateBookmark]);

  // 検索
  const searchBookmarks = useCallback((query: string): Bookmark[] => {
    if (!query.trim()) return bookmarks;
    
    const lowerQuery = query.toLowerCase();
    return bookmarks.filter(bookmark => 
      bookmark.title.toLowerCase().includes(lowerQuery) ||
      bookmark.messageContent.toLowerCase().includes(lowerQuery) ||
      bookmark.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      bookmark.category.name.toLowerCase().includes(lowerQuery)
    );
  }, [bookmarks]);

  // フィルタ
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

    if (filter.tags && filter.tags.length > 0) {
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

  // カテゴリ管理
  const addCategory = useCallback((categoryData: Omit<BookmarkCategory, 'id'>) => {
    const newCategory: BookmarkCategory = {
      ...categoryData,
      id: crypto.randomUUID()
    };
    const newCategories = [...categories, newCategory];
    setCategories(newCategories);
    saveToStorage(bookmarks, newCategories);
  }, [categories, bookmarks, saveToStorage]);

  const updateCategory = useCallback((categoryId: string, updates: Partial<BookmarkCategory>) => {
    const newCategories = categories.map(c => 
      c.id === categoryId ? { ...c, ...updates } : c
    );
    setCategories(newCategories);
    saveToStorage(bookmarks, newCategories);
  }, [categories, bookmarks, saveToStorage]);

  // エクスポート
  const exportBookmarks = useCallback((): string => {
    const exportData = {
      bookmarks,
      categories,
      exportedAt: Date.now(),
      version: '1.0'
    };
    return JSON.stringify(exportData, null, 2);
  }, [bookmarks, categories]);

  // インポート
  const importBookmarks = useCallback(async (data: string) => {
    try {
      const importData = JSON.parse(data);
      if (importData.bookmarks && Array.isArray(importData.bookmarks)) {
        setBookmarks(importData.bookmarks);
        saveToStorage(importData.bookmarks, importData.categories || categories);
      }
      if (importData.categories && Array.isArray(importData.categories)) {
        setCategories(importData.categories);
      }
    } catch (err) {
      throw new Error('インポートデータの形式が正しくありません');
    }
  }, [categories, saveToStorage]);

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