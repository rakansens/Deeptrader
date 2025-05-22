'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useSettings, MIN_SPEECH_RATE, MAX_SPEECH_RATE, DEFAULT_USER_NAME, DEFAULT_ASSISTANT_NAME } from '@/hooks/use-settings';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Settings, 
  Upload,
  Mic, 
  VolumeX, 
  Volume2, 
  User, 
  Bot, 
  Check,
  Volume1
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';

export function SettingsDropdown({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [userAvatarDialogOpen, setUserAvatarDialogOpen] = useState(false);
  const [assistantAvatarDialogOpen, setAssistantAvatarDialogOpen] = useState(false);
  const [speechSettingsDialogOpen, setSpeechSettingsDialogOpen] = useState(false);
  
  const {
    voiceInputEnabled,
    setVoiceInputEnabled,
    speechSynthesisEnabled,
    setSpeechSynthesisEnabled,
    userAvatar,
    setUserAvatar,
    assistantAvatar,
    setAssistantAvatar,
    speechRate,
    setSpeechRate,
    userName,
    setUserName,
    assistantName,
    setAssistantName
  } = useSettings();
  const { toast } = useToast();
  
  // ファイル入力用の参照
  const userAvatarInputRef = useRef<HTMLInputElement>(null);
  const assistantAvatarInputRef = useRef<HTMLInputElement>(null);
  
  // アップロード中状態の管理
  const [userAvatarUploading, setUserAvatarUploading] = useState(false);
  const [assistantAvatarUploading, setAssistantAvatarUploading] = useState(false);
  
  // 設定用の一時的な値
  const [tempUserAvatar, setTempUserAvatar] = useState(userAvatar || "");
  const [tempAssistantAvatar, setTempAssistantAvatar] = useState(assistantAvatar || "");
  const [tempSpeechRate, setTempSpeechRate] = useState(speechRate);
  const [tempUserName, setTempUserName] = useState(userName);
  const [tempAssistantName, setTempAssistantName] = useState(assistantName);
  
  useEffect(() => {
    setTempUserAvatar(userAvatar || "");
    setTempAssistantAvatar(assistantAvatar || "");
    setTempSpeechRate(speechRate);
    setTempUserName(userName);
    setTempAssistantName(assistantName);
  }, [userAvatar, assistantAvatar, speechRate, userName, assistantName]);
  
  // スピーチレートを読みやすい形式で表示する関数
  const formatSpeechRate = (rate: number) => {
    if (rate === 1.0) return "標準";
    if (rate < 1.0) return `遅い (${rate.toFixed(1)}x)`;
    return `速い (${rate.toFixed(1)}x)`;
  };
  
  // テスト音声を再生する関数
  const speakTestMessage = () => {
    if (!speechSynthesisEnabled) return;
    
    // テスト用のメッセージ
    const testMessage = "これは音声読み上げのテストです。この速度で読み上げが行われます。";
    
    // 読み上げを実行
    const utterance = new SpeechSynthesisUtterance(testMessage);
    utterance.lang = 'ja-JP'; // 日本語に設定
    utterance.rate = tempSpeechRate; // 設定中の速度を適用
    
    // 読み上げを開始
    window.speechSynthesis.cancel(); // 既存の読み上げをキャンセル
    window.speechSynthesis.speak(utterance);
  };
  
  // 画像ファイルをアップロード
  const uploadAvatar = async (file: File, isUser: boolean) => {
    try {
      if (isUser) {
        setUserAvatarUploading(true);
      } else {
        setAssistantAvatarUploading(true);
      }
      
      // ファイル名を生成
      const ext = file.name.split('.').pop() || 'png';
      const fileName = `avatar_${isUser ? 'user' : 'assistant'}_${Date.now()}.${ext}`;
      
      // Supabaseにアップロード
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);
        
      if (uploadError) {
        throw new Error(`アップロードエラー: ${uploadError.message}`);
      }
      
      // 公開URLを取得
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
        
      // 状態を更新
      if (isUser) {
        setTempUserAvatar(urlData.publicUrl);
      } else {
        setTempAssistantAvatar(urlData.publicUrl);
      }
      
      toast({
        title: "アップロード完了",
        description: "画像が正常にアップロードされました",
      });
    } catch (error) {
      logger.error('アバターアップロードエラー:', error);
      toast({
        title: "アップロードエラー",
        description: error instanceof Error ? error.message : "画像のアップロードに失敗しました",
        variant: "destructive",
      });
    } finally {
      if (isUser) {
        setUserAvatarUploading(false);
      } else {
        setAssistantAvatarUploading(false);
      }
    }
  };
  
  // ファイル選択ハンドラー
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, isUser: boolean) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAvatar(file, isUser);
    }
  };
  
  const toggleVoiceInput = () => {
    const newValue = !voiceInputEnabled;
    setVoiceInputEnabled(newValue);
    localStorage.setItem("voiceInputEnabled", String(newValue));
    
    toast({
      title: newValue ? "音声入力を有効化" : "音声入力を無効化",
      description: newValue 
        ? "チャット画面のマイクボタンを使用できます" 
        : "音声入力は無効になりました",
    });
  };
  
  const toggleSpeechSynthesis = () => {
    const newValue = !speechSynthesisEnabled;
    setSpeechSynthesisEnabled(newValue);
    localStorage.setItem("speechSynthesisEnabled", String(newValue));
    
    toast({
      title: newValue ? "読み上げ機能を有効化" : "読み上げ機能を無効化",
      description: newValue 
        ? "メッセージの横にあるスピーカーアイコンをクリックすると読み上げます" 
        : "読み上げ機能は無効になりました",
    });
  };
  
  // アバターと名前を保存
  const saveUserAvatar = () => {
    setUserAvatar(tempUserAvatar);
    setUserName(tempUserName);
    
    toast({
      title: "ユーザー設定を保存しました",
      description: "アイコンと表示名が更新されました",
    });
    
    setUserAvatarDialogOpen(false);
  };
  
  const saveAssistantAvatar = () => {
    setAssistantAvatar(tempAssistantAvatar);
    setAssistantName(tempAssistantName);
    
    toast({
      title: "AI設定を保存しました",
      description: "アイコンと表示名が更新されました",
    });
    
    setAssistantAvatarDialogOpen(false);
  };
  
  const saveSpeechRate = () => {
    setSpeechRate(tempSpeechRate);
    setSpeechSettingsDialogOpen(false);
    
    toast({
      title: "音声設定を保存しました",
      description: `読み上げ速度を${formatSpeechRate(tempSpeechRate)}に変更しました`,
    });
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("rounded-md bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground", className)}
          >
            <Settings className="h-4 w-4" />
            <span className="sr-only">設定</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-56 bg-background/95 backdrop-blur-sm border-border shadow-lg"
        >
          <DropdownMenuLabel>設定</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuGroup>
            <DropdownMenuItem 
              onSelect={(e) => {
                e.preventDefault();
                toggleVoiceInput();
              }}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <Mic className="mr-2 h-4 w-4" />
                  <span>音声入力</span>
                </div>
                <div className="h-4 w-4 flex items-center justify-center">
                  {voiceInputEnabled && <Check className="h-4 w-4" />}
                </div>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                toggleSpeechSynthesis();
              }}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  {speechSynthesisEnabled ? (
                    <Volume2 className="mr-2 h-4 w-4" />
                  ) : (
                    <VolumeX className="mr-2 h-4 w-4" />
                  )}
                  <span>メッセージ読み上げ</span>
                </div>
                <div className="h-4 w-4 flex items-center justify-center">
                  {speechSynthesisEnabled && <Check className="h-4 w-4" />}
                </div>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setSpeechSettingsDialogOpen(true);
                setOpen(false);
              }}
              disabled={!speechSynthesisEnabled}
            >
              <div className="flex items-center">
                <Volume1 className="mr-2 h-4 w-4" />
                <span>読み上げ速度: {formatSpeechRate(speechRate)}</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setUserAvatarDialogOpen(true);
              setOpen(false);
            }}
          >
            <div className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              <span>あなたの設定</span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setAssistantAvatarDialogOpen(true);
              setOpen(false);
            }}
          >
            <div className="flex items-center">
              <Bot className="mr-2 h-4 w-4" />
              <span>AIの設定</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* ユーザーアイコン設定ダイアログ */}
      <Dialog open={userAvatarDialogOpen} onOpenChange={setUserAvatarDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>あなたの設定</DialogTitle>
          </DialogHeader>
          
          {/* 名前入力欄を追加 */}
          <div className="space-y-4 my-4">
            <div>
              <Label htmlFor="user-name" className="text-sm mb-1 block">表示名</Label>
              <Input
                id="user-name"
                value={tempUserName}
                onChange={(e) => setTempUserName(e.target.value)}
                placeholder={DEFAULT_USER_NAME}
                className="w-full"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16 ring-2 ring-border">
                {tempUserAvatar && <AvatarImage src={tempUserAvatar} />}
                <AvatarFallback>{tempUserName[0] || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label htmlFor="user-avatar-url" className="text-sm mb-1 block">アイコンURL</Label>
                <Input
                  id="user-avatar-url"
                  value={tempUserAvatar}
                  onChange={(e) => setTempUserAvatar(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className="w-full"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <input
              ref={userAvatarInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => handleFileChange(e, true)}
            />
            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
              disabled={userAvatarUploading}
              onClick={() => userAvatarInputRef.current?.click()}
            >
              {userAvatarUploading ? (
                <>アップロード中...</>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  画像をアップロード
                </>
              )}
            </Button>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setUserAvatarDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={saveUserAvatar}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* AIアイコン設定ダイアログ */}
      <Dialog open={assistantAvatarDialogOpen} onOpenChange={setAssistantAvatarDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>AIの設定</DialogTitle>
          </DialogHeader>
          
          {/* 名前入力欄を追加 */}
          <div className="space-y-4 my-4">
            <div>
              <Label htmlFor="assistant-name" className="text-sm mb-1 block">表示名</Label>
              <Input
                id="assistant-name"
                value={tempAssistantName}
                onChange={(e) => setTempAssistantName(e.target.value)}
                placeholder={DEFAULT_ASSISTANT_NAME}
                className="w-full"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16 ring-2 ring-border">
                {tempAssistantAvatar && <AvatarImage src={tempAssistantAvatar} />}
                <AvatarFallback>{tempAssistantName[0] || "AI"}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label htmlFor="assistant-avatar-url" className="text-sm mb-1 block">アイコンURL</Label>
                <Input
                  id="assistant-avatar-url"
                  value={tempAssistantAvatar}
                  onChange={(e) => setTempAssistantAvatar(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className="w-full"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <input
              ref={assistantAvatarInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => handleFileChange(e, false)}
            />
            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
              disabled={assistantAvatarUploading}
              onClick={() => assistantAvatarInputRef.current?.click()}
            >
              {assistantAvatarUploading ? (
                <>アップロード中...</>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  画像をアップロード
                </>
              )}
            </Button>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setAssistantAvatarDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={saveAssistantAvatar}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 読み上げ速度設定ダイアログ */}
      <Dialog open={speechSettingsDialogOpen} onOpenChange={setSpeechSettingsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>読み上げ速度の設定</DialogTitle>
          </DialogHeader>
          <div className="my-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>読み上げ速度</Label>
                <span className="text-sm font-medium">{formatSpeechRate(tempSpeechRate)}</span>
              </div>
              <Slider
                value={[tempSpeechRate]}
                min={MIN_SPEECH_RATE}
                max={MAX_SPEECH_RATE}
                step={0.1}
                onValueChange={(value) => setTempSpeechRate(value[0])}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>遅い</span>
                <span>標準</span>
                <span>速い</span>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={speakTestMessage} 
              className="w-full"
              disabled={!speechSynthesisEnabled}
            >
              <Volume2 className="h-4 w-4 mr-2" />
              テスト再生
            </Button>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setSpeechSettingsDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={saveSpeechRate}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 