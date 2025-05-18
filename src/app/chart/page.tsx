'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import ChartToolbar from '@/components/chart/ChartToolbar'
import dynamic from 'next/dynamic'

// CandlestickChartをクライアントサイドレンダリングするためにdynamicインポート
const CandlestickChart = dynamic(() => import('@/components/CandlestickChart'), { 
  ssr: false 
})

export default function ChartPage() {
  const [timeframe, setTimeframe] = useState('1h')
  const [indicators, setIndicators] = useState({ ma: true, rsi: false })

  return (
    <div className="p-4">
      <Card>
        <ChartToolbar
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          indicators={indicators}
          onIndicatorsChange={setIndicators}
        />
        <CardContent className="pt-0">
          <CandlestickChart
            height={400}
          />
        </CardContent>
      </Card>
    </div>
  )
}
