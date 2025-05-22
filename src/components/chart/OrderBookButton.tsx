'use client'

import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'
import type { SymbolValue } from '@/constants/chart'

interface OrderBookButtonProps {
  symbol: SymbolValue
  currentPrice?: number
  showOrderBook: boolean
  onOrderBookToggle: () => void
}

// コンポーネント名を変更して機能を明確にする
export default function OrderBookButton({ 
  showOrderBook,
  onOrderBookToggle
}: OrderBookButtonProps) {
  return (
    <Button 
      variant="ghost" 
      size="sm"
      className={`p-1 h-7 ${showOrderBook ? "bg-muted" : ""}`}
      onClick={onOrderBookToggle}
      aria-label="Toggle OrderBook"
    >
      <BookOpen className="h-3.5 w-3.5" />
    </Button>
  )
} 