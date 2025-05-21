import { render, act, screen } from '@testing-library/react';
import Home from '@/app/page';
import { getUiControl } from '@/contexts/UiControlContext';
import CandlestickChart from '@/components/chart/CandlestickChart'; // Path to the actual component for jest.mock
import { Navbar } from '@/components/Navbar'; // Path to the actual component for jest.mock

// Mock CandlestickChart
// We use a variable to hold the mock constructor because jest.mock is hoisted
const MockedCandlestickChart = jest.fn(() => <div data-testid="candlestick-chart">Mocked Chart</div>);
jest.mock('@/components/chart/CandlestickChart', () => MockedCandlestickChart);

// Mock Navbar
const MockedNavbar = jest.fn(() => <div data-testid="navbar">Mocked Navbar</div>);
jest.mock('@/components/Navbar', () => ({
  Navbar: MockedNavbar, // Assuming Navbar is a named export
}));

// Mock Chat component as it might have its own complex state or effects
const MockedChat = jest.fn(() => <div data-testid="chat">Mocked Chat</div>);
jest.mock('@/components/chat/Chat', () => MockedChat);


// Mock Resizable components to simplify the DOM and avoid potential issues with their rendering logic
jest.mock('@/components/ui/resizable', () => ({
  ResizablePanelGroup: jest.fn(({ children }) => <div data-testid="resizable-panel-group">{children}</div>),
  ResizablePanel: jest.fn(({ children }) => <div data-testid="resizable-panel">{children}</div>),
  ResizableHandle: jest.fn(() => <div data-testid="resizable-handle" />),
}));


describe('Home Page - UiControlContext functionality', () => {
  // Clear mocks before each test to ensure a clean state for assertions like toHaveBeenLastCalledWith
  beforeEach(() => {
    MockedCandlestickChart.mockClear();
    MockedNavbar.mockClear();
    MockedChat.mockClear();
    // Clear localStorage to ensure welcome modal doesn't interfere,
    // or that tests for it run predictably if added later.
    localStorage.clear(); 
  });

  it('updates CandlestickChart indicators when toggleIndicator is called', () => {
    render(<Home />);
    const ui = getUiControl();

    // Initial state check (ma:true, rsi:false, macd: false, boll: false by default)
    // The component renders multiple times initially due to useEffects and dynamic imports.
    // We check the last call.
    expect(MockedCandlestickChart).toHaveBeenLastCalledWith(
      expect.objectContaining({
        indicators: { ma: true, rsi: false, macd: false, boll: false }
      }),
      expect.anything() // Context for functional components
    );

    // Toggle RSI on
    act(() => {
      ui.toggleIndicator('rsi', true);
    });
    expect(MockedCandlestickChart).toHaveBeenLastCalledWith(
      expect.objectContaining({
        indicators: { ma: true, rsi: true, macd: false, boll: false }
      }),
      expect.anything()
    );

    // Toggle RSI off
    act(() => {
      ui.toggleIndicator('rsi', false);
    });
    expect(MockedCandlestickChart).toHaveBeenLastCalledWith(
      expect.objectContaining({
        indicators: { ma: true, rsi: false, macd: false, boll: false }
      }),
      expect.anything()
    );

    // Toggle MACD on (initially false)
    act(() => {
      ui.toggleIndicator('macd');
    });
    expect(MockedCandlestickChart).toHaveBeenLastCalledWith(
      expect.objectContaining({
        indicators: { ma: true, rsi: false, macd: true, boll: false }
      }),
      expect.anything()
    );

    // Toggle MACD off
    act(() => {
      ui.toggleIndicator('macd');
    });
    expect(MockedCandlestickChart).toHaveBeenLastCalledWith(
      expect.objectContaining({
        indicators: { ma: true, rsi: false, macd: false, boll: false }
      }),
      expect.anything()
    );

    // Toggle BOLL on (initially false)
    act(() => {
      ui.toggleIndicator('boll', true);
    });
    expect(MockedCandlestickChart).toHaveBeenLastCalledWith(
      expect.objectContaining({
        indicators: { ma: true, rsi: false, macd: false, boll: true }
      }),
      expect.anything()
    );
    
    // Toggle MA off (initially true)
    act(() => {
      ui.toggleIndicator('ma');
    });
    expect(MockedCandlestickChart).toHaveBeenLastCalledWith(
      expect.objectContaining({
        indicators: { ma: false, rsi: false, macd: false, boll: true } // boll should remain true
      }),
      expect.anything()
    );

    // Toggle MA back on
    act(() => {
      ui.toggleIndicator('ma');
    });
    expect(MockedCandlestickChart).toHaveBeenLastCalledWith(
      expect.objectContaining({
        indicators: { ma: true, rsi: false, macd: false, boll: true }
      }),
      expect.anything()
    );
  });
});
