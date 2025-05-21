jest.mock('@mastra/core/tools', () => ({
  createTool: (opts: any) => opts,
}), { virtual: true });

import React from 'react';
import { toggleIndicatorTool } from '@/mastra/tools/toggleIndicatorTool';

describe('toggleIndicatorTool', () => {
  it('validates input schema', () => {
    expect(() =>
      toggleIndicatorTool.inputSchema!.parse({ indicator: 'ma', enabled: true })
    ).not.toThrow();
  });

  it('uses window function and returns success', async () => {
    const mockFn = jest.fn();
    window.toggleIndicator = mockFn;

    const execute = toggleIndicatorTool.execute as (params: any) => Promise<any>;
    const result = await execute({ context: { indicator: 'rsi', enabled: false } } as any);
    expect(mockFn).toHaveBeenCalledWith('rsi', false);
    expect(result).toEqual({ success: true });

    delete window.toggleIndicator;
  });
}); 