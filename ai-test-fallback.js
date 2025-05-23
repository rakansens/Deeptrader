// ai-test-fallback.js
// MASTRA ai/test フォールバック実装

/**
 * MASTRAが参照する ai/test モジュールのフォールバック
 * 実際のテスト機能は本番環境では不要のため、空の実装を提供
 */

// テスト関連の基本的なスタブを提供
export const test = () => ({});
export const describe = () => ({});
export const it = () => ({});
export const expect = () => ({});

// AI SDKテスト用の空のスタブ
export const createMockProvider = () => ({});
export const createTestMessages = () => [];
export const createTestTools = () => ({});

// デフォルトエクスポート
export default {
  test,
  describe,
  it,
  expect,
  createMockProvider,
  createTestMessages,
  createTestTools,
};

console.log('🔧 ai/test フォールバック: テスト機能は本番環境では無効化されています'); 