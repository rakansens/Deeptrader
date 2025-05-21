/**
 * Lightweight Chartsライブラリの型定義拡張
 * 公式の型定義に含まれていないメソッドを追加
 */
import { IChartApi } from 'lightweight-charts';

declare module 'lightweight-charts' {
  interface IChartApi {
    /**
     * チャートのスクリーンショットを取得する
     * Lightweight Charts v4.0.0以降で利用可能
     * @returns HTMLCanvasElement としてのスクリーンショットを返すPromise
     */
    takeScreenshot(): Promise<HTMLCanvasElement>;
  }
} 
