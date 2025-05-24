// 🎯 通知バッジコンポーネント
// 作成日: 2025/1/25
// 更新内容: DB通知システムとの統合

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, X, AlertTriangle, Info, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NotificationBadgeProps {
  className?: string;
}

// 通知タイプアイコンマッピング
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'trade_alert':
      return <AlertTriangle className="h-4 w-4 text-blue-500" />;
    case 'system':
      return <Info className="h-4 w-4 text-gray-500" />;
    default:
      return <Info className="h-4 w-4 text-gray-500" />;
  }
};

// 通知タイプ表示名
const getNotificationTypeLabel = (type: string) => {
  switch (type) {
    case 'success':
      return '成功';
    case 'warning':
      return '警告';
    case 'error':
      return 'エラー';
    case 'trade_alert':
      return '取引通知';
    case 'system':
      return 'システム';
    default:
      return '情報';
  }
};

// 日時フォーマット
const formatNotificationTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return '今';
  if (diffMins < 60) return `${diffMins}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 7) return `${diffDays}日前`;
  
  return date.toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric'
  });
};

export function NotificationBadge({ className }: NotificationBadgeProps) {
  const [open, setOpen] = useState(false);
  
  const {
    notifications,
    stats,
    isLoading,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    createNotification
  } = useNotifications();

  const unreadCount = stats?.unread_count || 0;
  const hasUnread = unreadCount > 0;

  // テスト通知作成
  const createTestNotification = async () => {
    await createNotification({
      title: "テスト通知",
      message: "これはテスト通知です。通知システムが正常に動作しています。",
      type: "info",
      priority: 2
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "relative rounded-md bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground",
            className
          )}
        >
          <Bell className="h-4 w-4" />
          {hasUnread && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">通知</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 bg-background/95 backdrop-blur-sm border-border shadow-lg"
      >
        <div className="flex items-center justify-between p-2">
          <DropdownMenuLabel>通知</DropdownMenuLabel>
          <div className="flex items-center gap-1">
            {hasUnread && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-6 px-2 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                全て既読
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={createTestNotification}
              className="h-6 px-2 text-xs"
            >
              テスト
            </Button>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            読み込み中...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            通知はありません
          </div>
        ) : (
          <ScrollArea className="h-80">
            <DropdownMenuGroup>
              {notifications.slice(0, 10).map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "flex flex-col items-start p-3 cursor-pointer",
                    !notification.is_read && "bg-muted/50"
                  )}
                  onSelect={(e) => {
                    e.preventDefault();
                    if (!notification.is_read) {
                      markAsRead(notification.id);
                    }
                  }}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            {getNotificationTypeLabel(notification.type)}
                          </span>
                          {notification.priority && notification.priority >= 4 && (
                            <Badge variant="destructive" className="h-4 px-1 text-xs">
                              重要
                            </Badge>
                          )}
                          {!notification.is_read && (
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                          )}
                        </div>
                        <p className="text-sm font-medium truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatNotificationTime(notification.created_at!)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissNotification(notification.id);
                      }}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </ScrollArea>
        )}
        
        {notifications.length > 10 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2 text-center">
              <Button variant="ghost" size="sm" className="text-xs">
                すべて表示 ({notifications.length})
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 