export interface AddressInfo {
  address: string;
  balance: string;
  txCount: number;
  nonce: number;
}

const BASE_URL =
  process.env.BLOCKCHAIR_BASE_URL ?? 'https://api.blockchair.com/ethereum';
const API_KEY = process.env.BLOCKCHAIR_API_KEY ?? '';

/**
 * Blockchair APIからアドレス情報を取得
 * @param address - ウォレットアドレス
 */
export async function getAddressInfo(address: string): Promise<AddressInfo> {
  const url = new URL(`${BASE_URL}/dashboards/address/${address}`);
  if (API_KEY) {
    url.searchParams.append('key', API_KEY);
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Failed to fetch address info: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const info = data.data?.[address]?.address ?? {};

  return {
    address,
    balance: String(info.balance ?? '0'),
    txCount: Number(info.transaction_count ?? 0),
    nonce: Number(info.nonce ?? 0)
  };
}
