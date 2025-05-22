'use client'

import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { type IndicatorSettings } from '@/constants/chart'
import MaSettings from './ma-settings'
import RsiSettings from './rsi-settings'
import MacdSettings from './macd-settings'
import BollSettings from './boll-settings'
import { TrendingUp, Activity, BarChart3, Waves } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IndicatorSettingsDropdownProps {
  settings: IndicatorSettings
  onSettingsChange: (s: IndicatorSettings) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export default function IndicatorSettingsDropdown({ 
  settings, 
  onSettingsChange,
  open,
  onOpenChange,
  children
}: IndicatorSettingsDropdownProps) {
  const [activeTab, setActiveTab] = useState('ma')

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      {children}
      <DropdownMenuContent className="w-[500px] p-4" align="end">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="ma" className="flex items-center gap-2">
              <TrendingUp className={cn("h-4 w-4", activeTab === "ma" ? "text-primary" : "text-muted-foreground")} />
              <span className="hidden sm:inline">MA</span>
            </TabsTrigger>
            <TabsTrigger value="rsi" className="flex items-center gap-2">
              <Activity className={cn("h-4 w-4", activeTab === "rsi" ? "text-primary" : "text-muted-foreground")} />
              <span className="hidden sm:inline">RSI</span>
            </TabsTrigger>
            <TabsTrigger value="macd" className="flex items-center gap-2">
              <BarChart3 className={cn("h-4 w-4", activeTab === "macd" ? "text-primary" : "text-muted-foreground")} />
              <span className="hidden sm:inline">MACD</span>
            </TabsTrigger>
            <TabsTrigger value="boll" className="flex items-center gap-2">
              <Waves className={cn("h-4 w-4", activeTab === "boll" ? "text-primary" : "text-muted-foreground")} />
              <span className="hidden sm:inline">BB</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="ma" className="mt-2">
            <div className="rounded-lg border p-3 bg-card shadow-sm">
              <MaSettings settings={settings} onChange={onSettingsChange} />
            </div>
          </TabsContent>
          <TabsContent value="rsi" className="mt-2">
            <div className="rounded-lg border p-3 bg-card shadow-sm">
              <RsiSettings settings={settings} onChange={onSettingsChange} />
            </div>
          </TabsContent>
          <TabsContent value="macd" className="mt-2">
            <div className="rounded-lg border p-3 bg-card shadow-sm">
              <MacdSettings settings={settings} onChange={onSettingsChange} />
            </div>
          </TabsContent>
          <TabsContent value="boll" className="mt-2">
            <div className="rounded-lg border p-3 bg-card shadow-sm">
              <BollSettings settings={settings} onChange={onSettingsChange} />
            </div>
          </TabsContent>
        </Tabs>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 