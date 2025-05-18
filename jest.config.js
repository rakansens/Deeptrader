// jest.config.js
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // next.config.jsとテスト環境用の.envファイルが配置されたディレクトリをセット
  dir: "./",
});

// Jestのカスタム設定
module.exports = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  moduleNameMapper: {
    // エイリアスの設定
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
  transform: {
    // ts-jestを使用してTypeScriptファイルをトランスパイル
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      { tsconfig: "tsconfig.jest.json", useESM: true },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  coverageDirectory: "<rootDir>/coverage",
};
