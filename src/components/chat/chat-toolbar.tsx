"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SettingsDropdown } from "@/components/SettingsDropdown";
import { Download, PanelLeft } from "lucide-react";

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
        <Button
          variant="ghost"
          size="icon"
          aria-label={sidebarOpen ? "スレッドを非表示" : "スレッドを表示"}
          aria-expanded={sidebarOpen}
          aria-controls="conversationSidebar"
          onClick={toggleSidebar}
          className="rounded-md bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <PanelLeft className={`h-4 w-4 ${!sidebarOpen ? "opacity-40" : ""}`} />
        </Button>
        {!sidebarOpen && totalConversations > 0 && (
          <span className="text-xs text-muted-foreground ml-1">
            {currentConversationIndex + 1}/{totalConversations}
          </span>
        )}
      </div>

      <div className="flex items-center space-x-1">
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
                    className="rounded-md bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>会話をエクスポート</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenuContent 
            align="end"
            className="bg-background/95 backdrop-blur-sm border-border shadow-lg"
          >
            <DropdownMenuItem onSelect={() => exportConversation("json")}> 
              JSONでダウンロード
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => exportConversation("txt")}> 
              テキストでダウンロード
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default ChatToolbar; 