'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { useFileUpload } from '@/hooks/use-file-upload';
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
  
  // 新しいDB設定フックを使用
  const {
    audioSettings,
    updateAudioSettings,
    isLoading: preferencesLoading,
    error: preferencesError
  } = useUserPreferences();
  
  // 新しいファイルアップロードフックを使用
  const {
    uploadFile,
    getActiveUserAvatar,
    isUploading: fileUploading,
    error: fileError
  } = useFileUpload();
  
  // アバター設定は一時的に従来のフックを併用（名前管理のみ）
  const {
    userName,
    setUserName,
    assistantName,
    setAssistantName
  } = useSettings();
  
  const { toast } = useToast();
  
  // ファイル入力用の参照
  const userAvatarInputRef = useRef<HTMLInputElement>(null);
  const assistantAvatarInputRef = useRef<HTMLInputElement>(null);
  
  // アバター状態管理（DBから取得）
  const [userAvatar, setUserAvatar] = useState<string>("");
  const [assistantAvatar, setAssistantAvatar] = useState<string>("");
  
  // 設定用の一時的な値
  const [tempUserAvatar, setTempUserAvatar] = useState("");
  const [tempAssistantAvatar, setTempAssistantAvatar] = useState("");
  const [tempSpeechRate, setTempSpeechRate] = useState(1.0);
  const [tempUserName, setTempUserName] = useState(userName);
  const [tempAssistantName, setTempAssistantName] = useState(assistantName);
  
  // 初回ロード時にLocalStorageからDBに移行
  const [migrationCompleted, setMigrationCompleted] = useState(false);
  
  // アバター情報をDBから取得
  useEffect(() => {
    const loadAvatars = async () => {
      try {
        const userAvatarFile = await getActiveUserAvatar(true);
        const assistantAvatarFile = await getActiveUserAvatar(false);
        
        if (userAvatarFile?.public_url) {
          setUserAvatar(userAvatarFile.public_url);
          setTempUserAvatar(userAvatarFile.public_url);
        }
        
        if (assistantAvatarFile?.public_url) {
          setAssistantAvatar(assistantAvatarFile.public_url);
          setTempAssistantAvatar(assistantAvatarFile.public_url);
        }
      } catch (error) {
        logger.error('[SettingsDropdown] アバター取得エラー:', error);
      }
    };
    
    loadAvatars();
  }, [getActiveUserAvatar]);
  
  useEffect(() => {
    if (!migrationCompleted && !preferencesLoading) {
      const migrateFromLocalStorage = async () => {
        try {
          const oldVoiceEnabled = localStorage.getItem("voiceInputEnabled");
          const oldSpeechEnabled = localStorage.getItem("speechSynthesisEnabled");
          const oldSpeechRate = localStorage.getItem("speechRate");
          
          // LocalStorageにデータがあり、DBに設定がない場合は移行
          if (oldVoiceEnabled !== null) {
            await updateAudioSettings({
              voice_enabled: oldVoiceEnabled === "true"
            });
            logger.info('[SettingsDropdown] 音声入力設定をDBに移行しました');
            localStorage.removeItem("voiceInputEnabled");
          }
          
          if (oldSpeechEnabled !== null) {
            const speechEnabled = oldSpeechEnabled === "true";
            const rate = oldSpeechRate ? parseFloat(oldSpeechRate) : 1.0;
            
            await updateAudioSettings({
              volume_level: speechEnabled ? rate : 0.0,
              alert_sound: "chime" // デフォルト値
            });
            logger.info('[SettingsDropdown] 読み上げ設定をDBに移行しました');
            localStorage.removeItem("speechSynthesisEnabled");
            if (oldSpeechRate) localStorage.removeItem("speechRate");
          }
          
          setMigrationCompleted(true);
          
          toast({
            title: "設定を移行しました",
            description: "設定がデータベースに保存され、デバイス間で同期されます",
          });
        } catch (error) {
          logger.error('[SettingsDropdown] 設定移行エラー:', error);
        }
      };
      
      migrateFromLocalStorage();
    }
  }, [migrationCompleted, preferencesLoading, updateAudioSettings]);
  
  useEffect(() => {
    setTempUserAvatar(userAvatar || "");
    setTempAssistantAvatar(assistantAvatar || "");
    setTempUserName(userName);
    setTempAssistantName(assistantName);
    // volume_levelから読み上げ速度を復元
    setTempSpeechRate(audioSettings.volume_level > 0 ? audioSettings.volume_level : 1.0);
  }, [userAvatar, assistantAvatar, userName, assistantName, audioSettings.volume_level]);
  
  // 音声入力とスピーチシンセシスの状態を計算
  const voiceInputEnabled = audioSettings.voice_enabled;
  const speechSynthesisEnabled = audioSettings.volume_level > 0;
  const speechRate = audioSettings.volume_level > 0 ? audioSettings.volume_level : 1.0;
  
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
      const fileType = isUser ? 'avatar_user' : 'avatar_assistant';
      const result = await uploadFile(file, fileType);
        
      if (result.success && result.file?.public_url) {
      // 状態を更新
      if (isUser) {
          setTempUserAvatar(result.file.public_url);
          setUserAvatar(result.file.public_url);
      } else {
          setTempAssistantAvatar(result.file.public_url);
          setAssistantAvatar(result.file.public_url);
      }
      
      toast({
        title: "アップロード完了",
        description: "画像が正常にアップロードされました",
      });
      } else {
        throw new Error(result.error || "アップロードに失敗しました");
      }
    } catch (error) {
      logger.error('[SettingsDropdown] アバターアップロードエラー:', error);
      toast({
        title: "アップロードエラー",
        description: error instanceof Error ? error.message : "画像のアップロードに失敗しました",
        variant: "destructive",
      });
    }
  };
  
  // ファイル選択ハンドラー
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, isUser: boolean) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAvatar(file, isUser);
    }
  };
  
  const toggleVoiceInput = async () => {
    const newValue = !voiceInputEnabled;
    try {
      await updateAudioSettings({
        voice_enabled: newValue
      });
    
    toast({
      title: newValue ? "音声入力を有効化" : "音声入力を無効化",
      description: newValue 
        ? "チャット画面のマイクボタンを使用できます" 
        : "音声入力は無効になりました",
    });
    } catch (error) {
      logger.error('[SettingsDropdown] 音声入力設定エラー:', error);
      toast({
        title: "設定エラー",
        description: "音声入力設定の更新に失敗しました",
        variant: "destructive",
      });
    }
  };
  
  const toggleSpeechSynthesis = async () => {
    const newValue = !speechSynthesisEnabled;
    try {
      await updateAudioSettings({
        volume_level: newValue ? tempSpeechRate : 0.0
      });
    
    toast({
      title: newValue ? "読み上げ機能を有効化" : "読み上げ機能を無効化",
      description: newValue 
        ? "メッセージの横にあるスピーカーアイコンをクリックすると読み上げます" 
        : "読み上げ機能は無効になりました",
    });
    } catch (error) {
      logger.error('[SettingsDropdown] 読み上げ設定エラー:', error);
      toast({
        title: "設定エラー",
        description: "読み上げ設定の更新に失敗しました",
        variant: "destructive",
      });
    }
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
  
  const saveSpeechRate = async () => {
    try {
      await updateAudioSettings({
        volume_level: tempSpeechRate
      });
    setSpeechSettingsDialogOpen(false);
    
    toast({
      title: "音声設定を保存しました",
      description: `読み上げ速度を${formatSpeechRate(tempSpeechRate)}に変更しました`,
    });
    } catch (error) {
      logger.error('[SettingsDropdown] 読み上げ速度設定エラー:', error);
      toast({
        title: "設定エラー",
        description: "読み上げ速度設定の更新に失敗しました",
        variant: "destructive",
      });
    }
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
              disabled={fileUploading}
              onClick={() => userAvatarInputRef.current?.click()}
            >
              {fileUploading ? (
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
              disabled={fileUploading}
              onClick={() => assistantAvatarInputRef.current?.click()}
            >
              {fileUploading ? (
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