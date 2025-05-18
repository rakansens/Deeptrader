import dynamic from 'next/dynamic';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Chat from '@/components/chat/Chat';

const PriceChart = dynamic(() => import('@/components/PriceChart'), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        {/* 左サイドバー: チャットUI */}
        <div className="w-full md:w-[400px] border-r flex flex-col h-[calc(100vh-3.5rem)]">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">AIアシスタント</h2>
            <p className="text-sm text-muted-foreground">
              トレーディングや市場分析に関して質問してください
            </p>
          </div>
          <div className="flex-1 p-4 overflow-hidden">
            <Chat />
          </div>
        </div>

        {/* 右パネル: チャートとダッシュボード情報 */}
        <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-auto">
          <div className="p-4 md:p-6">
            <h1 className="text-2xl font-bold tracking-tight mb-2">市場分析ダッシュボード</h1>
            <p className="text-muted-foreground mb-4">
              リアルタイムチャートと市場情報
            </p>
            
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle>BTC/USDT リアルタイムチャート</CardTitle>
                <CardDescription>
                  ビットコインの価格変動をリアルタイムで監視します
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <PriceChart />
                </div>
              </CardContent>
            </Card>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>市場状況</CardTitle>
                  <CardDescription>現在の市場トレンド</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$103,299.17</div>
                  <div className="text-xs text-muted-foreground">
                    +2.5% from last 24h
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>取引状況</CardTitle>
                  <CardDescription>最近の取引活動</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    資産配分とポジションの詳細がここに表示されます
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>シグナル</CardTitle>
                  <CardDescription>AIによる取引シグナル</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    現在のトレーディングシグナルと推奨アクションがここに表示されます
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
