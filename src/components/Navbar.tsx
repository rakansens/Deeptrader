"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, User, LogOut, LogIn } from "lucide-react";
import { NotificationBadge } from "@/components/NotificationBadge";
import { SettingsDropdown } from "@/components/SettingsDropdown";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/utils/supabase";
import { signOut } from "@/infrastructure/supabase/auth-service";
import { logger } from "@/lib/logger";

export function Navbar() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // 認証状態の監視
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        logger.error("ユーザー取得エラー:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logger.info(`認証状態変更: ${event} - ${session?.user?.email || 'なし'}`);
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = async () => {
    try {
      await signOut();
      logger.info("ログアウト完了");
      router.refresh();
    } catch (error) {
      logger.error("ログアウトエラー:", error);
    }
  };

  const handleLoginClick = () => {
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-2 flex items-center space-x-2">
            <BarChart3 className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">DeepTrader</span>
          </Link>
        </div>
        
        {/* 右側のツールバー */}
        <div className="ml-auto flex items-center space-x-2">
          <NotificationBadge />
          <SettingsDropdown />
          
          {/* 認証関連 */}
          {loading ? (
            <div className="h-9 w-9 animate-pulse bg-muted rounded-md" />
          ) : user ? (
            // ログイン済み - ユーザーメニュー
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <User className="h-4 w-4" />
                  <span className="sr-only">ユーザーメニュー</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-sm">
                      {user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ログイン中
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 dark:text-red-400 cursor-pointer"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // 未ログイン - ログインボタン
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoginClick}
              className="h-9"
            >
              <LogIn className="mr-2 h-4 w-4" />
              ログイン
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
