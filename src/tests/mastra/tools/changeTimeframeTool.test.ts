jest.mock('@mastra/core/tools', () => ({
  createTool: (opts: any) => opts,
}), { virtual: true });

import { changeTimeframeTool } from '@/mastra/tools/changeTimeframeTool';
import { TIMEFRAMES } from '@/constants/chart';

describe('changeTimeframeTool', () => {
  it('validates input schema', () => {
    expect(() =>
      changeTimeframeTool.inputSchema!.parse({ timeframe: TIMEFRAMES[0] })
    ).not.toThrow();
  });

  it('calls global function and returns success', async () => {
    const mockFn = jest.fn();
    (global as any).window = { changeTimeframe: mockFn } as any;
    // executeメソッドが存在することを保証
    const execute = changeTimeframeTool.execute as (params: any) => Promise<any>;
    const result = await execute({ context: { timeframe: TIMEFRAMES[1] } } as any);
    expect(mockFn).toHaveBeenCalledWith(TIMEFRAMES[1]);
    expect(result).toEqual({ success: true });
  });
});
