// jest.setup.js
require("@testing-library/jest-dom");

// Polyfill crypto.randomUUID for jsdom
if (typeof crypto.randomUUID !== "function") {
  crypto.randomUUID = () => Math.random().toString(36).slice(2);
}

// グローバルなモックの設定
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: "/",
    query: {},
  }),
}));

// 環境変数のモック
process.env = {
  ...process.env,
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
};
