import type { Json } from '@/types/supabase';

/**
 * Bitget APIの基本URL
 */
const BASE_URL = process.env.BITGET_BASE_URL ?? 'https://api.bitget.com';

/**
 * ティッカー情報
 */
export interface Ticker {
  symbol: string;
  high24h: string;
  low24h: string;
  last: string;
  bidPrice: string;
  askPrice: string;
  volume24h: string;
  timestamp: string;
}

/**
 * Bitgetからティッカー情報を取得
 * @param symbol - 例: "BTCUSDT"
 */
export async function getTicker(symbol: string): Promise<Ticker> {
  const url = `${BASE_URL}/api/v2/spot/market/ticker?symbol=${symbol}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch ticker: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const t = data.data ?? {};

  return {
    symbol: t.symbol ?? symbol,
    high24h: t.high24h ?? '',
    low24h: t.low24h ?? '',
    last: t.close ?? t.last ?? '',
    bidPrice: t.bestBid ?? t.bid ?? '',
    askPrice: t.bestAsk ?? t.ask ?? '',
    volume24h: t.baseVolume ?? t.volume24h ?? '',
    timestamp: t.ts ?? data.ts ?? new Date().toISOString(),
  };
}

export interface OrderRequest {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'market';
  quantity: number;
  price?: number;
  clientOrderId?: string;
  extraParams?: Json;
}

/**
 * Bitgetへ注文を送信
 *
 * この実装は簡易版であり、署名や完全なエラーハンドリングは省略しています。
 */
export async function placeOrder(req: OrderRequest): Promise<void> {
  const url = `${BASE_URL}/api/v2/spot/trade/place-order`;
  const headers = {
    'Content-Type': 'application/json',
    'X-BG-API-KEY': process.env.BITGET_API_KEY ?? '',
  };

  const body = JSON.stringify({
    symbol: req.symbol,
    side: req.side,
    orderType: req.type,
    force: 'gtc',
    price: req.price,
    quantity: req.quantity,
    clientOrderId: req.clientOrderId,
    extraParams: req.extraParams,
  });

  const res = await fetch(url, { method: 'POST', headers, body });
  if (!res.ok) {
    throw new Error(`Order failed: ${res.status} ${res.statusText}`);
  }
}
