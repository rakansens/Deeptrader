jest.mock('@mastra/core/tools', () => ({
  createTool: (opts: any) => opts
}), { virtual: true });

import { onChainDataTool } from '@/mastra/tools/onChainDataTool';

describe('onChainDataTool', () => {
  it('validates input schema', () => {
    expect(() => onChainDataTool.inputSchema.parse({ address: '0xabc' })).not.toThrow();
  });

  it('returns placeholder response', async () => {
    const result = await onChainDataTool.execute({ context: { address: '0xabc' } });
    expect(result).toEqual({ address: '0xabc', message: 'オンチェーンデータ取得は未実装です' });
  });
});
