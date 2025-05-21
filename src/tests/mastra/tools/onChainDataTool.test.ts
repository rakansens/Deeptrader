jest.mock('@mastra/core/tools', () => ({
  createTool: (opts: any) => opts
}), { virtual: true });

import { onChainDataTool } from '@/mastra/tools/onChainDataTool';
import { getAddressInfo } from '@/infrastructure/blockchain-service';

jest.mock('@/infrastructure/blockchain-service');

describe('onChainDataTool', () => {
  it('validates input schema', () => {
    expect(() => onChainDataTool.inputSchema!.parse({ address: '0xabc' })).not.toThrow();
  });

  it('fetches address info', async () => {
    const mockInfo = {
      address: '0xabc',
      balance: '1000',
      txCount: 5,
      nonce: 2
    };
    (getAddressInfo as jest.Mock).mockResolvedValue(mockInfo);
    // executeメソッドが存在することを保証
    const execute = onChainDataTool.execute as (params: any) => Promise<any>;
    const result = await execute({ context: { address: '0xabc' } } as any);
    expect(getAddressInfo).toHaveBeenCalledWith('0xabc');
    expect(result).toEqual(mockInfo);
  });
});
