export type PresentationMode = 'live' | 'fallback' | 'demo'

const MODE_KEY = 'asean_trademark_presentation_mode'
const MODE_EVENT = 'asean-presentation-mode-change'

export const demoModeEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_MODE === 'true'

export function getPresentationMode(): PresentationMode {
  if (!demoModeEnabled) return 'live'
  const stored = window.sessionStorage.getItem(MODE_KEY)
  return stored === 'demo' || stored === 'fallback' ? stored : 'live'
}

export function setPresentationMode(mode: PresentationMode) {
  const nextMode = demoModeEnabled ? mode : 'live'
  window.sessionStorage.setItem(MODE_KEY, nextMode)
  window.dispatchEvent(new CustomEvent<PresentationMode>(MODE_EVENT, { detail: nextMode }))
}

export function onPresentationModeChange(listener: (mode: PresentationMode) => void) {
  const handler = (event: Event) => listener((event as CustomEvent<PresentationMode>).detail)
  window.addEventListener(MODE_EVENT, handler)
  return () => window.removeEventListener(MODE_EVENT, handler)
}

function hasContent(value: unknown) {
  if (Array.isArray(value)) return value.length > 0
  return value !== null && value !== undefined
}

export async function resolvePresentationRead<T>(liveRequest: () => Promise<T>, fixture: T): Promise<T> {
  const mode = getPresentationMode()
  if (mode === 'demo' || mode === 'fallback') return structuredClone(fixture)

  try {
    const value = await liveRequest()
    if (hasContent(value)) return value
  } catch {
    // The UI switches to a clearly labelled fallback dataset below.
  }

  setPresentationMode('fallback')
  return structuredClone(fixture)
}

export async function resolvePresentationWrite<T>(liveRequest: () => Promise<T>, fixture: T): Promise<T> {
  if (getPresentationMode() === 'demo') return structuredClone(fixture)
  return liveRequest()
}
