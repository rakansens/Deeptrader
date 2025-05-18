'use client'
import { useEffect, useRef } from 'react'
import { createChart, LineData } from 'lightweight-charts'

export default function CryptoChart() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const chart = createChart(ref.current, { width: ref.current.clientWidth, height: 300 })
    const series = chart.addLineSeries()
    const data: LineData[] = [
      { time: '2024-01-01', value: 100 },
      { time: '2024-02-01', value: 105 },
      { time: '2024-03-01', value: 102 },
      { time: '2024-04-01', value: 110 },
      { time: '2024-05-01', value: 115 },
    ]
    series.setData(data)

    const handleResize = () => {
      chart.applyOptions({ width: ref.current!.clientWidth })
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [])

  return <div ref={ref} className="w-full" />
}
