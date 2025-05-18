"use client";

import Link from "next/link";
import { BarChart3, Home, MessageSquare, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-2 flex items-center space-x-2">
            <BarChart3 className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">DeepTrader</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/" title="ホーム">
                <Home className="h-5 w-5" />
                <span className="sr-only">ホーム</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/chat" title="チャット">
                <MessageSquare className="h-5 w-5" />
                <span className="sr-only">チャット</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/settings" title="設定">
                <Settings className="h-5 w-5" />
                <span className="sr-only">設定</span>
              </Link>
            </Button>
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
