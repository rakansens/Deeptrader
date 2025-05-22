import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

/**
 * `QueryClientProvider` でラップしてコンポーネントをレンダリングするユーティリティ
 * @param ui - テスト対象のReact要素
 * @param options - `@testing-library/react`のオプション
 */
export function renderWithQueryClient(
  ui: ReactElement,
  options?: RenderOptions,
) {
  const client = new QueryClient()
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return render(ui, { wrapper: Wrapper, ...options })
}

/**
 * フックを`QueryClientProvider`でラップしてレンダリングするユーティリティ
 * @param callback - テスト対象のフック
 * @param options - `renderHook`のオプション
 */
export function renderHookWithQueryClient<TResult, TProps = unknown>(
  callback: (props: TProps) => TResult,
  options?: Parameters<typeof import('@testing-library/react').renderHook<TResult, TProps>>[1],
) {
  const client = new QueryClient()
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return (require('@testing-library/react').renderHook as typeof import('@testing-library/react').renderHook)<TResult, TProps>(callback, {
    wrapper: Wrapper,
    ...options,
  })
}
