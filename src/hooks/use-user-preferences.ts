// 🎯 ユーザー設定管理フック（DB連携版）
// 作成日: 2025/1/25
// 更新内容: user_preferencesテーブルとの統合

"use client";

import { useEffect, useState, useCallback } from "react";
import { logger } from "@/lib/logger";
import { createClient } from '@/utils/supabase';
import type { Database } from "@/types/supabase";

type UserPreference = Database['public']['Tables']['user_preferences']['Row'];
type PreferenceCategory = UserPreference['category'];
type PreferenceInsert = Database['public']['Tables']['user_preferences']['Insert'];
type PreferenceUpdate = Database['public']['Tables']['user_preferences']['Update'];

// 設定タイプ定義
export interface UserAudioSettings {
  voice_enabled: boolean;
  alert_sound: string;
  volume_level: number;
}

export interface UserThemeSettings {
  color_scheme: 'light' | 'dark';
  accent_color: string;
  sidebar_collapsed: boolean;
}

export interface UserChartSettings {
  default_timeframe: string;
  show_volume: boolean;
  chart_style: 'candlestick' | 'line' | 'area';
}

export interface UserNotificationSettings {
  trade_alerts: boolean;
  price_alerts: boolean;
  system_alerts: boolean;
}

export interface UserTradingSettings {
  default_quantity: number;
  risk_level: 'low' | 'medium' | 'high';
  auto_stop_loss: boolean;
}

export interface UseUserPreferences {
  // 音声設定
  audioSettings: UserAudioSettings;
  updateAudioSettings: (settings: Partial<UserAudioSettings>) => Promise<void>;
  
  // テーマ設定
  themeSettings: UserThemeSettings;
  updateThemeSettings: (settings: Partial<UserThemeSettings>) => Promise<void>;
  
  // チャート設定
  chartSettings: UserChartSettings;
  updateChartSettings: (settings: Partial<UserChartSettings>) => Promise<void>;
  
  // 通知設定
  notificationSettings: UserNotificationSettings;
  updateNotificationSettings: (settings: Partial<UserNotificationSettings>) => Promise<void>;
  
  // トレーディング設定
  tradingSettings: UserTradingSettings;
  updateTradingSettings: (settings: Partial<UserTradingSettings>) => Promise<void>;
  
  // 汎用操作
  getPreference: (category: PreferenceCategory, key: string) => any;
  setPreference: (category: PreferenceCategory, key: string, value: any) => Promise<void>;
  
  // ローディング状態
  isLoading: boolean;
  error: string | null;
  
  // 再読み込み
  refreshPreferences: () => Promise<void>;
}

// デフォルト設定値
const DEFAULT_AUDIO_SETTINGS: UserAudioSettings = {
  voice_enabled: true,
  alert_sound: 'chime',
  volume_level: 0.8,
};

const DEFAULT_THEME_SETTINGS: UserThemeSettings = {
  color_scheme: 'dark',
  accent_color: 'blue',
  sidebar_collapsed: false,
};

const DEFAULT_CHART_SETTINGS: UserChartSettings = {
  default_timeframe: '1h',
  show_volume: true,
  chart_style: 'candlestick',
};

const DEFAULT_NOTIFICATION_SETTINGS: UserNotificationSettings = {
  trade_alerts: true,
  price_alerts: true,
  system_alerts: false,
};

const DEFAULT_TRADING_SETTINGS: UserTradingSettings = {
  default_quantity: 1.0,
  risk_level: 'medium',
  auto_stop_loss: true,
};

/**
 * ユーザー設定をデータベースで管理するフック
 */
export function useUserPreferences(): UseUserPreferences {
  const supabase = createClient();
  
  // 状態管理
  const [preferences, setPreferences] = useState<UserPreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 設定値を取得するヘルパー関数
  const getPreferenceValue = useCallback((category: PreferenceCategory, key: string, defaultValue: any) => {
    const preference = preferences.find(
      p => p.category === category && p.preference_key === key
    );
    
    if (!preference) return defaultValue;
    
    try {
      // JSONBから値を解析
      if (typeof preference.preference_value === 'string') {
        return JSON.parse(preference.preference_value);
      }
      return preference.preference_value;
    } catch {
      return defaultValue;
    }
  }, [preferences]);
  
  // 各カテゴリの設定を計算
  const audioSettings: UserAudioSettings = {
    voice_enabled: getPreferenceValue('audio', 'voice_enabled', DEFAULT_AUDIO_SETTINGS.voice_enabled),
    alert_sound: getPreferenceValue('audio', 'alert_sound', DEFAULT_AUDIO_SETTINGS.alert_sound),
    volume_level: getPreferenceValue('audio', 'volume_level', DEFAULT_AUDIO_SETTINGS.volume_level),
  };
  
  const themeSettings: UserThemeSettings = {
    color_scheme: getPreferenceValue('theme', 'color_scheme', DEFAULT_THEME_SETTINGS.color_scheme),
    accent_color: getPreferenceValue('theme', 'accent_color', DEFAULT_THEME_SETTINGS.accent_color),
    sidebar_collapsed: getPreferenceValue('theme', 'sidebar_collapsed', DEFAULT_THEME_SETTINGS.sidebar_collapsed),
  };
  
  const chartSettings: UserChartSettings = {
    default_timeframe: getPreferenceValue('chart', 'default_timeframe', DEFAULT_CHART_SETTINGS.default_timeframe),
    show_volume: getPreferenceValue('chart', 'show_volume', DEFAULT_CHART_SETTINGS.show_volume),
    chart_style: getPreferenceValue('chart', 'chart_style', DEFAULT_CHART_SETTINGS.chart_style),
  };
  
  const notificationSettings: UserNotificationSettings = {
    trade_alerts: getPreferenceValue('notifications', 'trade_alerts', DEFAULT_NOTIFICATION_SETTINGS.trade_alerts),
    price_alerts: getPreferenceValue('notifications', 'price_alerts', DEFAULT_NOTIFICATION_SETTINGS.price_alerts),
    system_alerts: getPreferenceValue('notifications', 'system_alerts', DEFAULT_NOTIFICATION_SETTINGS.system_alerts),
  };
  
  const tradingSettings: UserTradingSettings = {
    default_quantity: getPreferenceValue('trading', 'default_quantity', DEFAULT_TRADING_SETTINGS.default_quantity),
    risk_level: getPreferenceValue('trading', 'risk_level', DEFAULT_TRADING_SETTINGS.risk_level),
    auto_stop_loss: getPreferenceValue('trading', 'auto_stop_loss', DEFAULT_TRADING_SETTINGS.auto_stop_loss),
  };
  
  // 設定をデータベースから読み込み
  const loadPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        logger.warn('[useUserPreferences] ユーザーが認証されていません');
        setPreferences([]);
        return;
      }
      
      const { data, error: fetchError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id);
      
      if (fetchError) {
        logger.error('[useUserPreferences] 設定読み込みエラー:', fetchError);
        setError(fetchError.message);
        return;
      }
      
      setPreferences(data || []);
      logger.info('[useUserPreferences] 設定を読み込みました:', data?.length);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      logger.error('[useUserPreferences] 設定読み込み例外:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);
  
  // 汎用設定更新関数
  const setPreference = useCallback(async (category: PreferenceCategory, key: string, value: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('ユーザーが認証されていません');
      }
      
      // UPSERT処理（onConflictで一意制約に対応）
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          category,
          preference_key: key,
          preference_value: JSON.stringify(value),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,category,preference_key',  // 一意制約キーを指定
          ignoreDuplicates: false // 重複時は更新
        });
      
      if (error) {
        logger.error('[useUserPreferences] 設定保存エラー:', error);
        throw error;
      }
      
      // ローカル状態を更新
      setPreferences(prev => {
        const existing = prev.find(p => 
          p.category === category && p.preference_key === key && p.user_id === user.id
        );
        
        if (existing) {
          return prev.map(p => 
            p.category === category && p.preference_key === key && p.user_id === user.id
              ? { ...p, preference_value: JSON.stringify(value), updated_at: new Date().toISOString() }
              : p
          );
        } else {
          return [...prev, {
            id: crypto.randomUUID(),
            user_id: user.id,
            category,
            preference_key: key,
            preference_value: JSON.stringify(value),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }];
        }
      });
      
      logger.info('[useUserPreferences] 設定を保存しました:', [{ category, key, value }]);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '設定保存に失敗しました';
      logger.error('[useUserPreferences] 設定保存例外:', [err]);
      setError(errorMessage);
      throw err;
    }
  }, [supabase]);
  
  // カテゴリ別設定更新関数
  const updateAudioSettings = useCallback(async (newSettings: Partial<UserAudioSettings>) => {
    const promises = Object.entries(newSettings).map(([key, value]) => 
      setPreference('audio', key, value)
    );
    await Promise.all(promises);
  }, [setPreference]);
  
  const updateThemeSettings = useCallback(async (newSettings: Partial<UserThemeSettings>) => {
    const promises = Object.entries(newSettings).map(([key, value]) => 
      setPreference('theme', key, value)
    );
    await Promise.all(promises);
  }, [setPreference]);
  
  const updateChartSettings = useCallback(async (newSettings: Partial<UserChartSettings>) => {
    const promises = Object.entries(newSettings).map(([key, value]) => 
      setPreference('chart', key, value)
    );
    await Promise.all(promises);
  }, [setPreference]);
  
  const updateNotificationSettings = useCallback(async (newSettings: Partial<UserNotificationSettings>) => {
    const promises = Object.entries(newSettings).map(([key, value]) => 
      setPreference('notifications', key, value)
    );
    await Promise.all(promises);
  }, [setPreference]);
  
  const updateTradingSettings = useCallback(async (newSettings: Partial<UserTradingSettings>) => {
    const promises = Object.entries(newSettings).map(([key, value]) => 
      setPreference('trading', key, value)
    );
    await Promise.all(promises);
  }, [setPreference]);
  
  // 汎用取得関数
  const getPreference = useCallback((category: PreferenceCategory, key: string) => {
    return getPreferenceValue(category, key, null);
  }, [getPreferenceValue]);
  
  // 再読み込み関数
  const refreshPreferences = useCallback(async () => {
    await loadPreferences();
  }, [loadPreferences]);
  
  // 初期読み込み
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);
  
  return {
    audioSettings,
    updateAudioSettings,
    themeSettings,
    updateThemeSettings,
    chartSettings,
    updateChartSettings,
    notificationSettings,
    updateNotificationSettings,
    tradingSettings,
    updateTradingSettings,
    getPreference,
    setPreference,
    isLoading,
    error,
    refreshPreferences,
  };
}

export default useUserPreferences; 