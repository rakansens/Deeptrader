// jest.config.js
/**
 * Jest設定
 * Next.js依存を避け、ts-jestを利用してトランスパイルする
 */
const customJestConfig = {
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.jest.json',
    },
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // エイリアスの設定
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/'
  ],
  transform: {
    // ts-jestを使用してTypeScriptファイルをトランスパイル
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node'
  ],
  coverageDirectory: '<rootDir>/coverage',
};

module.exports = customJestConfig;
