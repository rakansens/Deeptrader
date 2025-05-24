import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ChatCommand, searchCommands, commandToText } from '@/lib/commands';
import { Command, Search, Hash, TrendingUp, BarChart3, Settings } from 'lucide-react';

interface CommandCompletionProps {
  input: string;
  onSelectCommand: (command: string) => void;
  isVisible: boolean;
  onClose: () => void;
  textAreaRef: React.RefObject<HTMLTextAreaElement>;
}

const categoryIcons = {
  'chart': BarChart3,
  'trading': TrendingUp,
  'analysis': Search,
  'general': Settings,
};

const categoryColors = {
  'chart': 'text-blue-500',
  'trading': 'text-green-500', 
  'analysis': 'text-purple-500',
  'general': 'text-gray-500',
};

export function CommandCompletion({
  input,
  onSelectCommand,
  isVisible,
  onClose,
  textAreaRef
}: CommandCompletionProps) {
  const [commands, setCommands] = useState<ChatCommand[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const completionRef = useRef<HTMLDivElement>(null);

  // コマンド候補を更新
  useEffect(() => {
    if (!input.startsWith('/') || !isVisible) {
      setCommands([]);
      return;
    }

    const suggestions = searchCommands(input);
    setCommands(suggestions);
    setSelectedIndex(0);
  }, [input, isVisible]);

  // キーボードナビゲーション
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isVisible || commands.length === 0) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => (prev + 1) % commands.length);
          break;
        
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => (prev - 1 + commands.length) % commands.length);
          break;
        
        case 'Enter':
          if (commands[selectedIndex]) {
            event.preventDefault();
            handleSelectCommand(commands[selectedIndex]);
          }
          break;
        
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, commands, selectedIndex, onClose]);

  // コマンド選択処理
  const handleSelectCommand = (command: ChatCommand) => {
    const commandText = command.command;
    
    // 引数がある場合はプレースホルダーを追加
    if (command.args && command.args.length > 0) {
      const requiredArgs = command.args.filter(arg => arg.required);
      if (requiredArgs.length > 0) {
        const placeholders = requiredArgs.map(arg => `<${arg.name}>`).join(' ');
        onSelectCommand(`${commandText} ${placeholders}`);
      } else {
        onSelectCommand(commandText + ' ');
      }
    } else {
      // 引数がない場合は直接テキストに変換して送信
      const convertedText = commandToText(commandText);
      onSelectCommand(convertedText);
    }
    
    onClose();
  };

  // textareaの位置を基に補完メニューの位置を計算
  const getCompletionPosition = () => {
    if (!textAreaRef.current) return { top: 0, left: 0 };
    
    const textarea = textAreaRef.current;
    const rect = textarea.getBoundingClientRect();
    
    return {
      top: rect.top - 8, // textareaの上に表示
      left: rect.left,
      maxWidth: rect.width
    };
  };

  if (!isVisible || commands.length === 0) {
    return null;
  }

  const position = getCompletionPosition();

  return (
    <div
      ref={completionRef}
      className="fixed z-50 bg-background border border-border rounded-lg shadow-lg overflow-hidden"
      style={{
        top: position.top - 200, // 補完メニューの高さ分上に移動
        left: position.left,
        maxWidth: position.maxWidth
      }}
    >
      <div className="p-2 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Command className="h-3 w-3" />
          <span>コマンド補完</span>
          <span className="ml-auto">↑↓で選択、Enterで決定</span>
        </div>
      </div>
      
      <div className="max-h-48 overflow-y-auto">
        {commands.map((command, index) => {
          const Icon = categoryIcons[command.category];
          const colorClass = categoryColors[command.category];
          
          return (
            <div
              key={command.command}
              className={cn(
                "flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors",
                index === selectedIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              )}
              onClick={() => handleSelectCommand(command)}
            >
              <Icon className={cn("h-4 w-4", colorClass)} />
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">
                  {command.command}
                  {command.args && command.args.length > 0 && (
                    <span className="text-muted-foreground ml-1">
                      {command.args.map(arg => 
                        arg.required ? `<${arg.name}>` : `[${arg.name}]`
                      ).join(' ')}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {command.description}
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                {command.category}
              </div>
            </div>
          );
        })}
      </div>
      
      {commands.length > 0 && (
        <div className="p-2 border-t border-border bg-muted/30">
          <div className="text-xs text-muted-foreground">
            {commands.length}件のコマンドが見つかりました
          </div>
        </div>
      )}
    </div>
  );
}

export default CommandCompletion; 