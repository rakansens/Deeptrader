-- 📚 ブックマーク管理システムテーブル作成
-- 作成日: 2025/1/25
-- 目的: チャットメッセージのブックマーク機能をDB化

-- ✅ ブックマークカテゴリテーブル
CREATE TABLE public.bookmark_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false, -- デフォルトカテゴリかどうか
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ✅ ブックマークメインテーブル
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  message_id UUID NOT NULL, -- chat_messagesへの参照（外部キー制約なし、削除されたメッセージへの対応）
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.bookmark_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_starred BOOLEAN DEFAULT false,
  
  -- メッセージ情報（検索・表示用）
  message_content TEXT NOT NULL,
  message_role TEXT NOT NULL CHECK (message_role IN ('user', 'assistant')),
  message_timestamp TIMESTAMPTZ NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ✅ ブックマークタグテーブル（多対多関係）
CREATE TABLE public.bookmark_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bookmark_id UUID REFERENCES public.bookmarks(id) ON DELETE CASCADE NOT NULL,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス追加（パフォーマンス向上）
CREATE INDEX idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX idx_bookmarks_message_id ON public.bookmarks(message_id);
CREATE INDEX idx_bookmarks_conversation_id ON public.bookmarks(conversation_id);
CREATE INDEX idx_bookmarks_category_id ON public.bookmarks(category_id);
CREATE INDEX idx_bookmarks_starred ON public.bookmarks(user_id, is_starred) WHERE is_starred = true;
CREATE INDEX idx_bookmarks_created ON public.bookmarks(user_id, created_at DESC);
CREATE INDEX idx_bookmark_tags_bookmark_id ON public.bookmark_tags(bookmark_id);
CREATE INDEX idx_bookmark_tags_name ON public.bookmark_tags(tag_name);

-- ユニーク制約
CREATE UNIQUE INDEX idx_bookmarks_user_message_unique ON public.bookmarks(user_id, message_id);
CREATE UNIQUE INDEX idx_bookmark_tags_unique ON public.bookmark_tags(bookmark_id, tag_name);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_bookmarks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bookmarks_updated_at
    BEFORE UPDATE ON public.bookmarks
    FOR EACH ROW
    EXECUTE FUNCTION update_bookmarks_updated_at();

CREATE TRIGGER trigger_update_bookmark_categories_updated_at
    BEFORE UPDATE ON public.bookmark_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_bookmarks_updated_at();

-- デフォルトカテゴリの挿入
INSERT INTO public.bookmark_categories (name, color, icon, description, is_default, display_order) VALUES
('取引戦略', 'bg-green-500', 'TrendingUp', '有効な取引戦略やアドバイス', true, 1),
('テクニカル分析', 'bg-blue-500', 'BarChart3', 'チャート分析や指標の解説', true, 2),
('市場洞察', 'bg-purple-500', 'Eye', '市場動向や重要な洞察', true, 3),
('リスク管理', 'bg-red-500', 'Shield', 'リスク管理のコツや注意点', true, 4),
('学習資料', 'bg-yellow-500', 'BookOpen', '学習に役立つ情報や解説', true, 5),
('一般', 'bg-gray-500', 'Bookmark', 'その他の重要な情報', true, 6);

-- ブックマーク検索用関数
CREATE OR REPLACE FUNCTION search_bookmarks(
    target_user_id UUID,
    search_query TEXT DEFAULT NULL,
    category_filter UUID DEFAULT NULL,
    starred_filter BOOLEAN DEFAULT NULL,
    role_filter TEXT DEFAULT NULL,
    tag_filter TEXT DEFAULT NULL,
    result_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
    bookmark_id UUID,
    title TEXT,
    description TEXT,
    message_content TEXT,
    message_role TEXT,
    is_starred BOOLEAN,
    category_name TEXT,
    category_color TEXT,
    category_icon TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id as bookmark_id,
        b.title,
        b.description,
        b.message_content,
        b.message_role,
        b.is_starred,
        bc.name as category_name,
        bc.color as category_color,
        bc.icon as category_icon,
        ARRAY_AGG(DISTINCT bt.tag_name) FILTER (WHERE bt.tag_name IS NOT NULL) as tags,
        b.created_at,
        b.updated_at
    FROM public.bookmarks b
    LEFT JOIN public.bookmark_categories bc ON b.category_id = bc.id
    LEFT JOIN public.bookmark_tags bt ON b.id = bt.bookmark_id
    WHERE 
        b.user_id = target_user_id
        AND (search_query IS NULL OR (
            b.title ILIKE '%' || search_query || '%' OR
            b.message_content ILIKE '%' || search_query || '%' OR
            b.description ILIKE '%' || search_query || '%'
        ))
        AND (category_filter IS NULL OR b.category_id = category_filter)
        AND (starred_filter IS NULL OR b.is_starred = starred_filter)
        AND (role_filter IS NULL OR b.message_role = role_filter)
        AND (tag_filter IS NULL OR EXISTS (
            SELECT 1 FROM public.bookmark_tags bt2 
            WHERE bt2.bookmark_id = b.id AND bt2.tag_name ILIKE '%' || tag_filter || '%'
        ))
    GROUP BY b.id, bc.name, bc.color, bc.icon
    ORDER BY b.created_at DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- ブックマーク統計取得関数
CREATE OR REPLACE FUNCTION get_bookmark_stats(target_user_id UUID)
RETURNS TABLE(
    total_bookmarks BIGINT,
    starred_bookmarks BIGINT,
    categories_used BIGINT,
    top_tags TEXT[],
    recent_activity_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_bookmarks,
        COUNT(*) FILTER (WHERE is_starred = true) as starred_bookmarks,
        COUNT(DISTINCT category_id) FILTER (WHERE category_id IS NOT NULL) as categories_used,
        ARRAY_AGG(DISTINCT tag_name ORDER BY tag_count DESC) FILTER (WHERE tag_name IS NOT NULL) as top_tags,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as recent_activity_count
    FROM public.bookmarks b
    LEFT JOIN (
        SELECT tag_name, COUNT(*) as tag_count
        FROM public.bookmark_tags bt
        JOIN public.bookmarks b2 ON bt.bookmark_id = b2.id
        WHERE b2.user_id = target_user_id
        GROUP BY tag_name
        ORDER BY tag_count DESC
        LIMIT 10
    ) top_tags_subquery ON true
    WHERE b.user_id = target_user_id;
END;
$$ LANGUAGE plpgsql; 