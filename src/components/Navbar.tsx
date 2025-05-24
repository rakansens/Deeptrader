"use client";

import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { NotificationBadge } from "@/components/NotificationBadge";
import { SettingsDropdown } from "@/components/SettingsDropdown";

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
        
        {/* 右側のツールバー */}
        <div className="ml-auto flex items-center space-x-2">
          <NotificationBadge />
          <SettingsDropdown />
        </div>
      </div>
    </header>
  );
}
