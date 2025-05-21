// src/components/Auth/AuthForm.tsx
// 認証フォームコンポーネント

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, signUp } from "@/infrastructure/supabase/auth-service";

const schema = z.object({
  email: z
    .string({ required_error: "メールアドレスを入力してください" })
    .email("正しいメールアドレスを入力してください"),
  password: z
    .string({ required_error: "パスワードを入力してください" })
    .min(6, "パスワードは6文字以上で入力してください"),
});

type FormData = z.infer<typeof schema>;

interface AuthFormProps {
  redirectTo?: string;
}

export default function AuthForm({ redirectTo = "/dashboard" }: AuthFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");

  const onSubmit = async ({ email, password }: FormData) => {
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === "login") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
        setMessage("確認メールを送信しました。メールを確認してください。");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("認証エラーが発生しました。");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">
        {mode === "login" ? "ログイン" : "アカウント登録"}
      </h2>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
          role="alert"
        >
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4"
          role="alert"
        >
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            {...register("email")}
            aria-invalid={errors.email ? "true" : undefined}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
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
            {...register("password")}
            aria-invalid={errors.password ? "true" : undefined}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
          <div className="text-right mt-1">
            <a
              href="/forgot-password"
              className="text-xs text-indigo-600 hover:text-indigo-500"
            >
              パスワードを忘れた場合
            </a>
          </div>
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
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          {mode === "login"
            ? "アカウントをお持ちでない方はこちら"
            : "すでにアカウントをお持ちの方はこちら"}
        </button>
      </div>
    </div>
  );
}
