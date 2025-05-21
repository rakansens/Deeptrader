import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CandlestickChart from '@/components/chart/CandlestickChart';
import { SYMBOLS, TIMEFRAMES, DEFAULT_INDICATOR_SETTINGS } from '@/constants/chart';

const onLayoutHandlers: (() => void)[] = [];

jest.mock('@/components/ui/resizable', () => ({
  ResizablePanelGroup: jest.fn(({ children, onLayout }) => {
    onLayoutHandlers.push(onLayout);
    return <div data-testid="resizable-group">{children}</div>;
  }),
  ResizablePanel: jest.fn(({ children }) => <div data-testid="resizable-panel">{children}</div>),
  ResizableHandle: jest.fn(() => <div data-testid="resizable-handle" />),
}));

jest.mock('@/hooks/use-order-book', () => ({
  __esModule: true,
  default: jest.fn(() => ({ bids: [], asks: [], connected: true })),
}));

jest.mock('lightweight-charts', () => {
  const timeScaleMocks: any[] = [];
  const mockCharts: any[] = [];
  
  const createChart = jest.fn(() => {
    const timeScale = {
      subscribeVisibleLogicalRangeChange: jest.fn(),
      unsubscribeVisibleLogicalRangeChange: jest.fn(),
      setVisibleLogicalRange: jest.fn(),
      getVisibleLogicalRange: jest.fn(),
    };
    timeScaleMocks.push(timeScale);
    
    const chart = {
      addCandlestickSeries: jest.fn(() => ({ setData: jest.fn(), update: jest.fn(), applyOptions: jest.fn() })),
      addLineSeries: jest.fn(() => ({ setData: jest.fn(), update: jest.fn() })),
      addHistogramSeries: jest.fn(() => ({ setData: jest.fn(), update: jest.fn(), applyOptions: jest.fn() })),
      priceScale: jest.fn(() => ({ applyOptions: jest.fn() })),
      timeScale: jest.fn(() => timeScale),
      applyOptions: jest.fn(),
      resize: jest.fn(),
      removeSeries: jest.fn(),
      remove: jest.fn(),
    };
    
    mockCharts.push(chart);
    return chart;
  });
  
  (createChart as any).timeScaleMocks = timeScaleMocks;
  (createChart as any).mockCharts = mockCharts;
  
  return { createChart, CrosshairMode: { Normal: 0, Magnet: 1 } };
});

jest.useFakeTimers();

describe('CandlestickChart order book', () => {
  beforeEach(() => {
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ clearRect: jest.fn() } as any);
    jest.spyOn(window, 'dispatchEvent');
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    onLayoutHandlers.length = 0;
    jest.clearAllTimers();
  });

  it('toggles order book visibility', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] } as Response);
    global.WebSocket = jest.fn(() => ({ close: jest.fn(), onmessage: null })) as any;

    render(
      <CandlestickChart
        symbol={SYMBOLS[0].value}
        interval={TIMEFRAMES[0]}
        useApi={false}
        indicatorSettings={DEFAULT_INDICATOR_SETTINGS}
      />,
    );

    expect(screen.getByTestId('orderbook-panel')).toBeInTheDocument();
    await user.click(screen.getByLabelText('Close OrderBook'));
    jest.advanceTimersByTime(0);
    expect(screen.queryByTestId('orderbook-panel')).toBeNull();
    const showBtn = screen.getByTitle('OrderBookを表示');
    expect(showBtn).toBeInTheDocument();
    await user.click(showBtn);
    jest.advanceTimersByTime(0);
    expect(screen.getByTestId('orderbook-panel')).toBeInTheDocument();
  });

  it('dispatches resize and resizes chart on layout change', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] } as Response);
    global.WebSocket = jest.fn(() => ({ close: jest.fn(), onmessage: null })) as any;
    render(
      <CandlestickChart
        symbol={SYMBOLS[0].value}
        interval={TIMEFRAMES[0]}
        useApi={false}
        indicatorSettings={DEFAULT_INDICATOR_SETTINGS}
      />,
    );
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
    const { createChart } = require('lightweight-charts');
    const mockCharts = createChart.mockCharts;
    onLayoutHandlers.forEach(h => h && h());
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
    expect((dispatchSpy.mock.calls[0][0] as Event).type).toBe('resize');
    jest.advanceTimersByTime(0);
    const lastChart = mockCharts[mockCharts.length - 1];
    expect(lastChart.resize).toHaveBeenCalled();
  });
});
