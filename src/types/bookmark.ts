// ブックマーク機能の型定義

export interface Bookmark {
  id: string;
  messageId: string;
  conversationId: string;
  title: string;
  description?: string;
  category: BookmarkCategory;
  tags: string[];
  isStarred: boolean;
  createdAt: number;
  updatedAt: number;
  // メッセージの内容（検索用）
  messageContent: string;
  messageRole: 'user' | 'assistant';
  messageTimestamp: number;
}

export interface BookmarkCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  description?: string;
}

// 予定義カテゴリ
export const DEFAULT_BOOKMARK_CATEGORIES: BookmarkCategory[] = [
  {
    id: 'trading-strategy',
    name: '取引戦略',
    color: 'bg-green-500',
    icon: 'TrendingUp',
    description: '有効な取引戦略やアドバイス'
  },
  {
    id: 'technical-analysis',
    name: 'テクニカル分析',
    color: 'bg-blue-500',
    icon: 'BarChart3',
    description: 'チャート分析や指標の解説'
  },
  {
    id: 'market-insight',
    name: '市場洞察',
    color: 'bg-purple-500',
    icon: 'Eye',
    description: '市場動向や重要な洞察'
  },
  {
    id: 'risk-management',
    name: 'リスク管理',
    color: 'bg-red-500',
    icon: 'Shield',
    description: 'リスク管理のコツや注意点'
  },
  {
    id: 'education',
    name: '学習資料',
    color: 'bg-yellow-500',
    icon: 'BookOpen',
    description: '学習に役立つ情報や解説'
  },
  {
    id: 'general',
    name: '一般',
    color: 'bg-gray-500',
    icon: 'Bookmark',
    description: 'その他の重要な情報'
  }
];

// ブックマーク検索フィルター
export interface BookmarkFilter {
  category?: string;
  tags?: string[];
  isStarred?: boolean;
  dateRange?: {
    start: number;
    end: number;
  };
  messageRole?: 'user' | 'assistant';
  searchQuery?: string;
} 