jest.mock('@mastra/core/tools', () => ({
  createTool: (opts: any) => opts,
}), { virtual: true });

import React from 'react';
import { changeTimeframeTool } from '@/mastra/tools/changeTimeframeTool';
import { TIMEFRAMES } from '@/constants/chart';

describe('changeTimeframeTool', () => {
  it('validates input schema', () => {
    expect(() =>
      changeTimeframeTool.inputSchema!.parse({ timeframe: TIMEFRAMES[0] })
    ).not.toThrow();
  });

  it('uses window function and returns success', async () => {
    const mockFn = jest.fn();
    window.changeTimeframe = mockFn;

    const execute = changeTimeframeTool.execute as (params: any) => Promise<any>;
    const result = await execute({ context: { timeframe: TIMEFRAMES[1] } } as any);
    expect(mockFn).toHaveBeenCalledWith(TIMEFRAMES[1]);
    expect(result).toEqual({ success: true });

    delete window.changeTimeframe;
  });
}); 