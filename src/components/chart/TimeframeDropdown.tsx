'use client'

import { useState } from 'react'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { TIMEFRAMES, type Timeframe } from '@/constants/chart'
import { cn } from '@/lib/utils'

// タイムフレームカテゴリ
const TIMEFRAME_CATEGORIES = {
  短時間: ['1m', '3m', '5m', '15m', '30m'],
  長時間: ['1h', '2h', '4h', '6h', '8h', '12h'],
  日以上: ['1d', '3d', '1w', '1M']
};

interface TimeframeDropdownProps {
  timeframe: Timeframe;
  onTimeframeChange: (timeframe: Timeframe) => void;
  displayTimeframes: string[];
  onDisplayChange: (tf: string, isVisible: boolean) => void;
  allTimeframes: readonly string[];
}

export default function TimeframeDropdown({ 
  timeframe, 
  onTimeframeChange,
  displayTimeframes,
  onDisplayChange,
  allTimeframes
}: TimeframeDropdownProps) {
  return (
    <HoverCard openDelay={100} closeDelay={200}>
      <HoverCardTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-xs px-1.5 py-1 h-7 flex items-center"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-[300px]" align="start">
        <h3 className="text-sm font-medium mb-3">時間フレーム設定</h3>
        
        <div className="space-y-4">
          {/* 短時間 */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground">短時間</h3>
            <div className="grid grid-cols-3 gap-2">
              {TIMEFRAME_CATEGORIES.短時間.map((tf) => (
                <div key={tf} className="flex items-center space-x-2">
                  <Checkbox 
                    checked={displayTimeframes.includes(tf)}
                    id={`tf-${tf}`}
                    onCheckedChange={(checked) => {
                      onDisplayChange(tf, checked === true);
                    }}
                  />
                  <label 
                    htmlFor={`tf-${tf}`}
                    className={cn(
                      "text-xs cursor-pointer",
                      tf === timeframe && "font-medium"
                    )}
                    onClick={() => {
                      if (TIMEFRAMES.includes(tf as Timeframe)) {
                        onTimeframeChange(tf as Timeframe);
                      }
                    }}
                  >
                    {tf}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* 長時間 */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground">長時間</h3>
            <div className="grid grid-cols-3 gap-2">
              {TIMEFRAME_CATEGORIES.長時間.map((tf) => (
                <div key={tf} className="flex items-center space-x-2">
                  <Checkbox 
                    checked={displayTimeframes.includes(tf)}
                    id={`tf-${tf}`}
                    onCheckedChange={(checked) => {
                      onDisplayChange(tf, checked === true);
                    }}
                  />
                  <label 
                    htmlFor={`tf-${tf}`}
                    className={cn(
                      "text-xs cursor-pointer",
                      tf === timeframe && "font-medium"
                    )}
                    onClick={() => {
                      if (TIMEFRAMES.includes(tf as Timeframe)) {
                        onTimeframeChange(tf as Timeframe);
                      }
                    }}
                  >
                    {tf}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* 日以上 */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground">日以上</h3>
            <div className="grid grid-cols-3 gap-2">
              {TIMEFRAME_CATEGORIES.日以上.map((tf) => (
                <div key={tf} className="flex items-center space-x-2">
                  <Checkbox 
                    checked={displayTimeframes.includes(tf)}
                    id={`tf-${tf}`}
                    onCheckedChange={(checked) => {
                      onDisplayChange(tf, checked === true);
                    }}
                  />
                  <label 
                    htmlFor={`tf-${tf}`}
                    className={cn(
                      "text-xs cursor-pointer",
                      tf === timeframe && "font-medium"
                    )}
                    onClick={() => {
                      if (TIMEFRAMES.includes(tf as Timeframe)) {
                        onTimeframeChange(tf as Timeframe);
                      }
                    }}
                  >
                    {tf}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
} 