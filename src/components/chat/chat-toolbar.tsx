"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SettingsDropdown } from "@/components/SettingsDropdown";
import { Download, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatToolbarProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  exportConversation: (format: "json" | "txt") => void;
  totalConversations?: number;
  currentConversationIndex?: number;
}

export function ChatToolbar({
  sidebarOpen,
  toggleSidebar,
  exportConversation,
  totalConversations = 0,
  currentConversationIndex = 0,
}: ChatToolbarProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={sidebarOpen ? "スレッドを非表示" : "スレッドを表示"}
                aria-expanded={sidebarOpen}
                aria-controls="conversationSidebar"
                onClick={toggleSidebar}
                className="rounded-md bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-300"
              >
                <PanelLeft className={cn("h-4 w-4 transition-transform hover:scale-110 duration-200", !sidebarOpen ? "opacity-40" : "")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-background/95 backdrop-blur-sm border-border shadow-sm">
              <p className="text-xs font-medium">{sidebarOpen ? "スレッドを非表示" : "スレッドを表示"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {!sidebarOpen && totalConversations > 0 && (
          <span className="text-xs text-muted-foreground ml-1 bg-background/50 px-1.5 py-0.5 rounded-sm">
            {currentConversationIndex + 1}/{totalConversations}
          </span>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <SettingsDropdown />

        <DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="会話をエクスポート"
                    className="rounded-md bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-300"
                  >
                    <Download className="h-4 w-4 transition-transform hover:scale-110 duration-200" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-background/95 backdrop-blur-sm border-border shadow-sm">
                <p className="text-xs font-medium">会話をエクスポート</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenuContent 
            align="end"
            className="bg-background/95 backdrop-blur-sm border-border shadow-lg w-48"
          >
            <DropdownMenuLabel>エクスポート</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onSelect={() => exportConversation("json")}
              className="cursor-pointer text-sm transition-colors hover:bg-muted/50 focus:bg-muted/50"
            > 
              JSONでダウンロード
            </DropdownMenuItem>
            <DropdownMenuItem 
              onSelect={() => exportConversation("txt")}
              className="cursor-pointer text-sm transition-colors hover:bg-muted/50 focus:bg-muted/50"
            > 
              テキストでダウンロード
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default ChatToolbar; 