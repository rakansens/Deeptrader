'use client'

import * as React from 'react'
import type { Timeframe } from '@/constants/chart'

export interface UiControlContextValue {
  toggleIndicator: (name: string, enabled?: boolean) => void
  changeTimeframe: (timeframe: Timeframe) => void
}

let currentValue: UiControlContextValue | null = null

const UiControlContext = React.createContext<UiControlContextValue | null>(null)

interface UiControlProviderProps {
  value: UiControlContextValue
  children: React.ReactNode
}

export function UiControlProvider({ value, children }: UiControlProviderProps) {
  React.useEffect(() => {
    currentValue = value
    return () => {
      currentValue = null
    }
  }, [value])

  return (
    <UiControlContext.Provider value={value}>{children}</UiControlContext.Provider>
  )
}

export function useUiControl() {
  const ctx = React.useContext(UiControlContext)
  if (!ctx) {
    throw new Error('useUiControl must be used within UiControlProvider')
  }
  return ctx
}

export function getUiControl(): UiControlContextValue {
  if (!currentValue) {
    throw new Error('UiControl context is not initialized')
  }
  return currentValue
}
