import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  demoModeEnabled,
  getPresentationMode,
  onPresentationModeChange,
  setPresentationMode,
  type PresentationMode,
} from '@/demo/runtime'

interface PresentationContextValue {
  mode: PresentationMode
  demoEnabled: boolean
  isPresentationData: boolean
  enterDemo: () => void
  exitPresentation: () => void
}

const PresentationContext = createContext<PresentationContextValue | null>(null)

export function PresentationProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PresentationMode>(getPresentationMode)

  useEffect(() => onPresentationModeChange(setMode), [])

  const enterDemo = useCallback(() => setPresentationMode('demo'), [])
  const exitPresentation = useCallback(() => setPresentationMode('live'), [])

  const value = useMemo<PresentationContextValue>(
    () => ({
      mode,
      demoEnabled: demoModeEnabled,
      isPresentationData: mode !== 'live',
      enterDemo,
      exitPresentation,
    }),
    [enterDemo, exitPresentation, mode],
  )

  return <PresentationContext.Provider value={value}>{children}</PresentationContext.Provider>
}

export function usePresentation() {
  const context = useContext(PresentationContext)
  if (!context) throw new Error('usePresentation must be used within PresentationProvider')
  return context
}
