// jest.config.js
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Next.jsアプリの場所（next.config.jsがある場所）
  dir: "./",
});

// Jestの追加設定
const config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  
  // テストパスの設定
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.(ts|tsx|js)",
    "<rootDir>/src/**/*.(test|spec).(ts|tsx|js)",
    "<rootDir>/__tests__/**/*.(ts|tsx|js)",
    "<rootDir>/tests/**/*.(test|spec).(ts|tsx|js)"
  ],
  
  // カバレッジ設定
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.{js,jsx,ts,tsx}",
    "!src/**/index.{js,jsx,ts,tsx}",
  ],
  
  // モジュールパス解決
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@/components/(.*)$": "<rootDir>/src/components/$1",
    "^@/lib/(.*)$": "<rootDir>/src/lib/$1",
    "^@/mastra/(.*)$": "<rootDir>/src/mastra/$1",
  },
  
  // セットアップファイル
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  
  // テスト除外パス
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "<rootDir>/tests/integration/", // 統合テストは別途実行
    "<rootDir>/tests/scripts/", // スクリプトは別途実行
  ],
  
  // タイムアウト設定
  testTimeout: 10000,
};

// createJestConfigで設定を適用
module.exports = createJestConfig(config);
