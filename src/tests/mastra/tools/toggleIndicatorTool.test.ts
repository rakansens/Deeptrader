jest.mock('@mastra/core/tools', () => ({
  createTool: (opts: any) => opts,
}), { virtual: true });

import { toggleIndicatorTool } from '@/mastra/tools/toggleIndicatorTool';

describe('toggleIndicatorTool', () => {
  it('validates input schema', () => {
    expect(() =>
      toggleIndicatorTool.inputSchema!.parse({ indicator: 'ma', enabled: true })
    ).not.toThrow();
  });

  it('calls global function and returns success', async () => {
    const mockFn = jest.fn();
    (global as any).window = { toggleIndicator: mockFn } as any;
    const result = await toggleIndicatorTool.execute({ context: { indicator: 'rsi', enabled: false } } as any);
    expect(mockFn).toHaveBeenCalledWith('rsi', false);
    expect(result).toEqual({ success: true });
  });
});
