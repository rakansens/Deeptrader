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
import SettingsDialog from "@/components/SettingsDialog";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";

interface ChatToolbarProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  exportConversation: (format: "json" | "txt") => void;
}

export function ChatToolbar({
  sidebarOpen,
  toggleSidebar,
  exportConversation,
}: ChatToolbarProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <Button
          variant="ghost"
          size="icon"
          aria-label={sidebarOpen ? "スレッドを非表示" : "スレッドを表示"}
          aria-expanded={sidebarOpen}
          aria-controls="conversationSidebar"
          onClick={toggleSidebar}
          className="text-muted-foreground hover:text-foreground"
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="flex items-center space-x-1">
        <SettingsDialog />

        <DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="会話をエクスポート"
                    className="text-muted-foreground hover:text-foreground"
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
          <DropdownMenuContent align="end">
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