'use client'

import { useState } from 'react'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { type IndicatorSettings } from '@/constants/chart'
import MaSettings from './ma-settings'
import RsiSettings from './rsi-settings'
import MacdSettings from './macd-settings'
import BollSettings from './boll-settings'
import { TrendingUp, Activity, BarChart3, Waves, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IndicatorSettingsDropdownProps {
  settings: IndicatorSettings
  onSettingsChange: (s: IndicatorSettings) => void
}

export default function IndicatorSettingsDropdown({ 
  settings, 
  onSettingsChange
}: IndicatorSettingsDropdownProps) {
  const [activeTab, setActiveTab] = useState('ma')

  return (
    <HoverCard openDelay={100} closeDelay={200}>
      <HoverCardTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-xs px-1.5 py-1 h-7 flex items-center"
          title="指標設定"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-[320px] p-3" align="end">
        <h3 className="text-sm font-medium mb-3">指標設定</h3>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-3 bg-muted/60">
            <TabsTrigger value="ma" className="flex items-center gap-1 h-8 text-xs">
              <TrendingUp className={cn("h-3.5 w-3.5", activeTab === "ma" ? "text-primary" : "text-muted-foreground")} />
              <span>MA</span>
            </TabsTrigger>
            <TabsTrigger value="rsi" className="flex items-center gap-1 h-8 text-xs">
              <Activity className={cn("h-3.5 w-3.5", activeTab === "rsi" ? "text-primary" : "text-muted-foreground")} />
              <span>RSI</span>
            </TabsTrigger>
            <TabsTrigger value="macd" className="flex items-center gap-1 h-8 text-xs">
              <BarChart3 className={cn("h-3.5 w-3.5", activeTab === "macd" ? "text-primary" : "text-muted-foreground")} />
              <span>MACD</span>
            </TabsTrigger>
            <TabsTrigger value="boll" className="flex items-center gap-1 h-8 text-xs">
              <Waves className={cn("h-3.5 w-3.5", activeTab === "boll" ? "text-primary" : "text-muted-foreground")} />
              <span>BB</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="ma" className="mt-2">
            <div className="rounded-md border p-2.5 bg-card shadow-sm text-xs">
              <MaSettings settings={settings} onChange={onSettingsChange} />
            </div>
          </TabsContent>
          <TabsContent value="rsi" className="mt-2">
            <div className="rounded-md border p-2.5 bg-card shadow-sm text-xs">
              <RsiSettings settings={settings} onChange={onSettingsChange} />
            </div>
          </TabsContent>
          <TabsContent value="macd" className="mt-2">
            <div className="rounded-md border p-2.5 bg-card shadow-sm text-xs">
              <MacdSettings settings={settings} onChange={onSettingsChange} />
            </div>
          </TabsContent>
          <TabsContent value="boll" className="mt-2">
            <div className="rounded-md border p-2.5 bg-card shadow-sm text-xs">
              <BollSettings settings={settings} onChange={onSettingsChange} />
            </div>
          </TabsContent>
        </Tabs>
      </HoverCardContent>
    </HoverCard>
  )
} 