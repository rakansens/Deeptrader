jest.mock('@mastra/core/tools', () => ({
  createTool: (opts: any) => opts,
}), { virtual: true });

import { render } from '@testing-library/react';
import { UiControlProvider } from '@/contexts/UiControlContext';
import { toggleIndicatorTool } from '@/mastra/tools/toggleIndicatorTool';

describe('toggleIndicatorTool', () => {
  it('validates input schema', () => {
    expect(() =>
      toggleIndicatorTool.inputSchema!.parse({ indicator: 'ma', enabled: true })
    ).not.toThrow();
  });

  it('uses context function and returns success', async () => {
    const mockFn = jest.fn();
    const { unmount } = render(
      <UiControlProvider value={{ toggleIndicator: mockFn, changeTimeframe: jest.fn() }}>
        <div />
      </UiControlProvider>
    );

    const execute = toggleIndicatorTool.execute as (params: any) => Promise<any>;
    const result = await execute({ context: { indicator: 'rsi', enabled: false } } as any);
    expect(mockFn).toHaveBeenCalledWith('rsi', false);
    expect(result).toEqual({ success: true });
    unmount();
  });
});
