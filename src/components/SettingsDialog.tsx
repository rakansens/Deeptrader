'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useSettings } from '@/hooks/use-settings';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Settings, Upload, Image, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';

export function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const {
    voiceInputEnabled,
    setVoiceInputEnabled,
    speechSynthesisEnabled,
    setSpeechSynthesisEnabled,
    userAvatar,
    setUserAvatar,
    assistantAvatar,
    setAssistantAvatar,
  } = useSettings();
  const { toast } = useToast();
  
  // ローカルでの状態管理
  const [localVoiceEnabled, setLocalVoiceEnabled] = useState(voiceInputEnabled);
  const [localSpeechEnabled, setLocalSpeechEnabled] = useState(speechSynthesisEnabled);
  const [localUserAvatar, setLocalUserAvatar] = useState(userAvatar ?? "");
  const [localAssistantAvatar, setLocalAssistantAvatar] = useState(assistantAvatar ?? "");
  
  // アップロード中状態の管理
  const [userAvatarUploading, setUserAvatarUploading] = useState(false);
  const [assistantAvatarUploading, setAssistantAvatarUploading] = useState(false);
  
  // ファイル入力用の参照
  const userAvatarInputRef = useRef<HTMLInputElement>(null);
  const assistantAvatarInputRef = useRef<HTMLInputElement>(null);
  
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
        setLocalUserAvatar(urlData.publicUrl);
      } else {
        setLocalAssistantAvatar(urlData.publicUrl);
      }
      
      toast({
        title: "アップロード完了",
        description: "画像が正常にアップロードされました",
      });
    } catch (error) {
      console.error('アバターアップロードエラー:', error);
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
  
  // 設定を適用（保存）
  const applySettings = () => {
    console.log("設定を保存します:", { 音声入力: localVoiceEnabled, 読み上げ: localSpeechEnabled });

    // localStorageに直接書き込む
    localStorage.setItem("voiceInputEnabled", String(localVoiceEnabled));
    localStorage.setItem("speechSynthesisEnabled", String(localSpeechEnabled));
    localStorage.setItem("userAvatar", localUserAvatar);
    localStorage.setItem("assistantAvatar", localAssistantAvatar);

    // useSettingsフックの状態も更新
    setVoiceInputEnabled(localVoiceEnabled);
    setSpeechSynthesisEnabled(localSpeechEnabled);
    setUserAvatar(localUserAvatar);
    setAssistantAvatar(localAssistantAvatar);
    
    // 設定の保存を確認
    const storedVoice = localStorage.getItem("voiceInputEnabled");
    const storedSpeech = localStorage.getItem("speechSynthesisEnabled");
    
    toast({
      title: "設定を保存しました",
      description: "設定が反映されました",
    });
    
    // ダイアログを閉じる
    setOpen(false);
  };
  
  // 親コンポーネントの状態が変わったら同期
  useEffect(() => {
    setLocalVoiceEnabled(voiceInputEnabled);
    setLocalSpeechEnabled(speechSynthesisEnabled);
    setLocalUserAvatar(userAvatar ?? "");
    setLocalAssistantAvatar(assistantAvatar ?? "");
  }, [voiceInputEnabled, speechSynthesisEnabled, userAvatar, assistantAvatar]);
  
  // DialogがOpenになったら最新の値に更新
  useEffect(() => {
    if (open) {
      // LocalStorageから直接読み込む（信頼性向上のため）
      const storedVoice = localStorage.getItem("voiceInputEnabled");
      const storedSpeech = localStorage.getItem("speechSynthesisEnabled");
      const storedUserAvatar = localStorage.getItem("userAvatar");
      const storedAssistantAvatar = localStorage.getItem("assistantAvatar");
      
      
      // LocalStorageの値を優先
      if (storedVoice !== null) {
        setLocalVoiceEnabled(storedVoice === "true");
      } else {
        setLocalVoiceEnabled(voiceInputEnabled);
      }
      
      if (storedSpeech !== null) {
        setLocalSpeechEnabled(storedSpeech === "true");
      } else {
        setLocalSpeechEnabled(speechSynthesisEnabled);
      }

      if (storedUserAvatar !== null) {
        setLocalUserAvatar(storedUserAvatar);
      } else {
        setLocalUserAvatar(userAvatar ?? "");
      }

      if (storedAssistantAvatar !== null) {
        setLocalAssistantAvatar(storedAssistantAvatar);
      } else {
        setLocalAssistantAvatar(assistantAvatar ?? "");
      }
    }
  }, [open, voiceInputEnabled, speechSynthesisEnabled, userAvatar, assistantAvatar]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="設定" className="text-muted-foreground hover:text-foreground">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>設定</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex flex-col space-y-1.5">
            <div className="flex items-center justify-between space-x-2">
              <div>
                <Label htmlFor="voice-input" className="font-medium">音声入力</Label>
                <p className="text-xs text-muted-foreground">
                  マイクを使って音声でメッセージを入力できます
                </p>
              </div>
              <Switch
                id="voice-input"
                checked={localVoiceEnabled}
                onCheckedChange={setLocalVoiceEnabled}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {localVoiceEnabled 
                ? "✅ 音声入力は有効です。チャット画面のマイクボタンを使用できます。" 
                : "❌ 音声入力は無効です。"}
            </div>
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <div className="flex items-center justify-between space-x-2">
              <div>
                <Label htmlFor="speech-synthesis" className="font-medium">メッセージ読み上げ</Label>
                <p className="text-xs text-muted-foreground">
                  AIからの返答を音声で読み上げるボタンを表示します
                </p>
              </div>
              <Switch
                id="speech-synthesis"
                checked={localSpeechEnabled}
                onCheckedChange={setLocalSpeechEnabled}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {localSpeechEnabled
                ? "✅ 読み上げは有効です。メッセージの横にあるスピーカーアイコンをクリックすると読み上げます。"
                : "❌ 読み上げは無効です。"}
            </div>
          </div>

          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="user-avatar" className="font-medium">あなたのアイコン</Label>
            <div className="flex items-center space-x-2">
              <div className="flex-shrink-0">
                <Avatar className="h-10 w-10 ring-2 ring-border">
                  {localUserAvatar && <AvatarImage src={localUserAvatar} />}
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  id="user-avatar"
                  value={localUserAvatar}
                  onChange={(e) => setLocalUserAvatar(e.target.value)}
                  placeholder="https://example.com/me.png"
                />
                <div className="flex items-center gap-2">
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
                    size="sm"
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
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="assistant-avatar" className="font-medium">AIのアイコン</Label>
            <div className="flex items-center space-x-2">
              <div className="flex-shrink-0">
                <Avatar className="h-10 w-10 ring-2 ring-border">
                  {localAssistantAvatar && <AvatarImage src={localAssistantAvatar} />}
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  id="assistant-avatar"
                  value={localAssistantAvatar}
                  onChange={(e) => setLocalAssistantAvatar(e.target.value)}
                  placeholder="https://example.com/ai.png"
                />
                <div className="flex items-center gap-2">
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
                    size="sm"
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
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button onClick={applySettings}>
            設定を保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SettingsDialog; 
