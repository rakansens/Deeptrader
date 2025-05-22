'use client'

import { useState } from 'react'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Button } from '@/components/ui/button'
import OrderBookPanel from './OrderBookPanel'
import { BookOpen } from 'lucide-react'
import type { SymbolValue } from '@/constants/chart'

interface OrderBookHoverCardProps {
  symbol: SymbolValue
  currentPrice?: number
  showOrderBook: boolean
  onOrderBookToggle: () => void
}

export default function OrderBookHoverCard({ 
  symbol, 
  currentPrice,
  showOrderBook,
  onOrderBookToggle
}: OrderBookHoverCardProps) {
  return (
    <HoverCard openDelay={0} closeDelay={300}>
      <HoverCardTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className={`p-1 h-7 ${showOrderBook ? "bg-muted" : ""}`}
          onClick={onOrderBookToggle}
          title="オーダーブック"
          aria-label="Toggle OrderBook"
        >
          <BookOpen className="h-3.5 w-3.5" />
        </Button>
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-[320px] p-0 max-h-[calc(100vh-120px)]" 
        align="end" 
        side="bottom" 
        avoidCollisions={true}
        sideOffset={5}
      >
        <OrderBookPanel
          symbol={symbol}
          height="auto"
          currentPrice={currentPrice}
          className="border-none shadow-none max-h-[calc(100vh-120px)] overflow-hidden"
        />
      </HoverCardContent>
    </HoverCard>
  )
} 