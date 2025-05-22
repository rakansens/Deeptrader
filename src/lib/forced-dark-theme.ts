/**
 * useThemeを常にダークモードに強制するためのユーティリティ
 * ThemeProviderでforcedTheme="dark"を設定しているが、
 * 念のためuseThemeフックの戻り値も常にdarkに設定
 */
export function getThemeValue() {
  return {
    theme: 'dark',
    setTheme: () => {}, // ダミー関数（テーマの変更を無効化）
    themes: ['dark'],
    systemTheme: 'dark',
    resolvedTheme: 'dark',
  };
} 