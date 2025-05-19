/**
 * IndicatorPanel コンポーネントをモックするユーティリティ
 * テスト内で jest.mock('@/components/chart/IndicatorPanel') を
 * 設定する際に使用する。
 */
export default function mockIndicatorPanel() {
  return {
    __esModule: true,
    default: ({ initChart, title }: { initChart?: (el: HTMLDivElement) => void; title: string }) => {
      const ref = { current: document.createElement('div') } as { current: HTMLDivElement }
      if (initChart) initChart(ref.current)
      return <div data-testid={`${title.toLowerCase()}-panel`} />
    }
  }
}
