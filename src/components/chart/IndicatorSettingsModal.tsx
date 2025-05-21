'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { DEFAULT_INDICATOR_SETTINGS, type IndicatorSettings } from '@/constants/chart'
import MaSettings from './ma-settings'
import RsiSettings from './rsi-settings'
import MacdSettings from './macd-settings'
import BollSettings from './boll-settings'
import { TrendingUp, Activity, BarChart3, Waves } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IndicatorSettingsModalProps {
  settings: IndicatorSettings
  onSettingsChange: (s: IndicatorSettings) => void
}

export default function IndicatorSettingsModal({ settings, onSettingsChange }: IndicatorSettingsModalProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('ma')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 p-0" aria-label="指標設定">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">指標設定</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-2">
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
          <TabsContent value="ma" className="space-y-4 mt-2">
            <div className="rounded-lg border p-4 bg-card shadow-sm">
              <MaSettings settings={settings} onChange={onSettingsChange} />
            </div>
          </TabsContent>
          <TabsContent value="rsi" className="space-y-4 mt-2">
            <div className="rounded-lg border p-4 bg-card shadow-sm">
              <RsiSettings settings={settings} onChange={onSettingsChange} />
            </div>
          </TabsContent>
          <TabsContent value="macd" className="space-y-4 mt-2">
            <div className="rounded-lg border p-4 bg-card shadow-sm">
              <MacdSettings settings={settings} onChange={onSettingsChange} />
            </div>
          </TabsContent>
          <TabsContent value="boll" className="space-y-4 mt-2">
            <div className="rounded-lg border p-4 bg-card shadow-sm">
              <BollSettings settings={settings} onChange={onSettingsChange} />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 