// 🔐 ログインページ
// 作成日: 2025/1/25
// 目的: ブックマーク機能テスト用の認証ページ

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/infrastructure/supabase/auth-service";
import { logger } from "@/lib/logger";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === "login") {
        await signIn(email, password);
        logger.info("ログイン成功");
        router.push("/"); // メインページに戻る
      } else {
        await signUp(email, password);
        logger.info("ユーザー登録成功");
        setError("確認メールを送信しました。メールを確認してください。");
      }
    } catch (error: unknown) {
      logger.error("認証エラー:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("認証エラーが発生しました。");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 開発環境用のクイックログイン
  const handleDevLogin = async () => {
    setEmail("rakansens@gmail.com");
    setPassword("test123456");
    
    // 自動的にログインを試行
    setIsLoading(true);
    setError(null);
    
    try {
      await signIn("rakansens@gmail.com", "test123456");
      logger.info("開発環境ログイン成功");
      router.push("/");
    } catch (error) {
      logger.error("開発環境ログインエラー:", error);
      setError("開発環境ユーザーでログインできませんでした。ユーザーを作成してください。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
          {mode === "login" ? "ログイン" : "アカウント登録"}
        </h2>

        {error && (
          <div
            className={`border px-4 py-3 rounded mb-4 ${
              error.includes("確認メール") 
                ? "bg-green-100 border-green-400 text-green-700"
                : "bg-red-100 border-red-400 text-red-700"
            }`}
            role="alert"
          >
            <span>{error}</span>
          </div>
        )}

        {/* 開発環境用クイックログイン */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
            🧪 開発環境用
          </h3>
          <button
            onClick={handleDevLogin}
            disabled={isLoading}
            className="w-full text-sm py-2 px-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            テストユーザーでログイン
          </button>
          <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
            rakansens@gmail.com でログイン
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            />
            {mode === "signup" && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                6文字以上で入力してください
              </p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? "処理中..." : mode === "login" ? "ログイン" : "登録"}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            {mode === "login"
              ? "アカウントをお持ちでない方はこちら"
              : "すでにアカウントをお持ちの方はこちら"}
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-gray-600 hover:text-gray-500 dark:text-gray-400"
          >
            メインページに戻る
          </button>
        </div>
      </div>
    </div>
  );
} 