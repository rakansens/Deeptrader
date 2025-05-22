'use client'

import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
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
  className?: string
}

export default function IndicatorSettingsDropdown({ 
  settings, 
  onSettingsChange,
  className
}: IndicatorSettingsDropdownProps) {
  // 設定変更時のログ出力用ラッパー
  const handleSettingsChange = (newSettings: IndicatorSettings) => {
    // 線幅設定の確認ログ
    console.log('指標設定を更新：', {
      ma1: newSettings.lineWidth.ma1,
      ma2: newSettings.lineWidth.ma2,
      ma3: newSettings.lineWidth.ma3,
      ma: newSettings.lineWidth.ma,
      boll: newSettings.lineWidth.boll
    });
    onSettingsChange(newSettings);
  };
  const [activeTab, setActiveTab] = useState('ma')
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className={cn("rounded-md bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground", className)}
          title="指標設定"
        >
          <Settings className="h-4 w-4" />
          <span className="sr-only">指標設定</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-[330px] bg-background/95 backdrop-blur-sm border-border shadow-lg" 
        align="end"
      >
        <DropdownMenuLabel>指標設定</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="p-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-3 bg-muted/60">
              <TabsTrigger value="ma" className="flex items-center gap-1 h-8 text-xs data-[state=active]:bg-background/80 data-[state=active]:shadow-sm transition-all">
                <TrendingUp className={cn("h-3.5 w-3.5", activeTab === "ma" ? "text-primary" : "text-muted-foreground")} />
                <span>MA</span>
              </TabsTrigger>
              <TabsTrigger value="rsi" className="flex items-center gap-1 h-8 text-xs data-[state=active]:bg-background/80 data-[state=active]:shadow-sm transition-all">
                <Activity className={cn("h-3.5 w-3.5", activeTab === "rsi" ? "text-primary" : "text-muted-foreground")} />
                <span>RSI</span>
              </TabsTrigger>
              <TabsTrigger value="macd" className="flex items-center gap-1 h-8 text-xs data-[state=active]:bg-background/80 data-[state=active]:shadow-sm transition-all">
                <BarChart3 className={cn("h-3.5 w-3.5", activeTab === "macd" ? "text-primary" : "text-muted-foreground")} />
                <span>MACD</span>
              </TabsTrigger>
              <TabsTrigger value="boll" className="flex items-center gap-1 h-8 text-xs data-[state=active]:bg-background/80 data-[state=active]:shadow-sm transition-all">
                <Waves className={cn("h-3.5 w-3.5", activeTab === "boll" ? "text-primary" : "text-muted-foreground")} />
                <span>BB</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="ma" className="mt-2 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in-50 data-[state=active]:data-[state=active]:animate-in data-[state=active]:zoom-in-95">
              <div className="rounded-md border p-2.5 bg-card/95 shadow-sm text-xs">
                <MaSettings settings={settings} onChange={handleSettingsChange} />
              </div>
            </TabsContent>
            <TabsContent value="rsi" className="mt-2 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in-50 data-[state=active]:data-[state=active]:animate-in data-[state=active]:zoom-in-95">
              <div className="rounded-md border p-2.5 bg-card/95 shadow-sm text-xs">
                <RsiSettings settings={settings} onChange={handleSettingsChange} />
              </div>
            </TabsContent>
            <TabsContent value="macd" className="mt-2 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in-50 data-[state=active]:data-[state=active]:animate-in data-[state=active]:zoom-in-95">
              <div className="rounded-md border p-2.5 bg-card/95 shadow-sm text-xs">
                <MacdSettings settings={settings} onChange={handleSettingsChange} />
              </div>
            </TabsContent>
            <TabsContent value="boll" className="mt-2 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in-50 data-[state=active]:data-[state=active]:animate-in data-[state=active]:zoom-in-95">
              <div className="rounded-md border p-2.5 bg-card/95 shadow-sm text-xs">
                <BollSettings settings={settings} onChange={handleSettingsChange} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 