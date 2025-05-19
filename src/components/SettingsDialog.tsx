'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useSettings } from '@/hooks/use-settings';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const {
    voiceInputEnabled,
    setVoiceInputEnabled,
    speechSynthesisEnabled,
    setSpeechSynthesisEnabled,
  } = useSettings();
  const { toast } = useToast();
  
  // ローカルでの状態管理
  const [localVoiceEnabled, setLocalVoiceEnabled] = useState(voiceInputEnabled);
  const [localSpeechEnabled, setLocalSpeechEnabled] = useState(speechSynthesisEnabled);
  
  // 設定を適用（保存）
  const applySettings = () => {
    console.log("設定を保存します:", { 音声入力: localVoiceEnabled, 読み上げ: localSpeechEnabled });
    
    // localStorageに直接書き込む
    localStorage.setItem("voiceInputEnabled", String(localVoiceEnabled));
    localStorage.setItem("speechSynthesisEnabled", String(localSpeechEnabled));
    
    // useSettingsフックの状態も更新
    setVoiceInputEnabled(localVoiceEnabled);
    setSpeechSynthesisEnabled(localSpeechEnabled);
    
    // 設定の保存を確認
    const storedVoice = localStorage.getItem("voiceInputEnabled");
    const storedSpeech = localStorage.getItem("speechSynthesisEnabled");
    console.log("保存後の確認:", { 音声入力: storedVoice, 読み上げ: storedSpeech });
    
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
  }, [voiceInputEnabled, speechSynthesisEnabled]);
  
  // DialogがOpenになったら最新の値に更新
  useEffect(() => {
    if (open) {
      // LocalStorageから直接読み込む（信頼性向上のため）
      const storedVoice = localStorage.getItem("voiceInputEnabled");
      const storedSpeech = localStorage.getItem("speechSynthesisEnabled");
      
      console.log("ダイアログオープン時の値:", { 
        hooksの値: { 音声入力: voiceInputEnabled, 読み上げ: speechSynthesisEnabled },
        localStorage値: { 音声入力: storedVoice, 読み上げ: storedSpeech }
      });
      
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
    }
  }, [open, voiceInputEnabled, speechSynthesisEnabled]);

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
                  AIからの返答を音声で読み上げます
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
                ? "✅ 読み上げは有効です。AIの返答を自動的に読み上げます。" 
                : "❌ 読み上げは無効です。"}
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