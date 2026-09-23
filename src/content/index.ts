import type { Settings } from '../shared/types'
import { STORAGE_KEY, MSG, OVERLAY_ID } from '../shared/constants'
import { coerceSettings } from '../shared/validate'
import { createOverlay, removeOverlay, updateIntensity, updateTexture, updateBlendMode, getOverlayElement } from './overlay'

function shouldShowOverlay(settings: Settings): boolean {
  return settings.enabled
}

console.log('[Papr] content script loaded')
chrome.storage.sync.get(STORAGE_KEY, (result) => {
  const raw = result[STORAGE_KEY] as Partial<Settings> | undefined
  console.log('[Papr] storage.get result:', raw)
  const settings = coerceSettings(raw)
  console.log('[Papr] coerced settings:', JSON.stringify(settings))
  if (shouldShowOverlay(settings)) {
    console.log('[Papr] calling createOverlay')
    createOverlay(settings)
  } else {
    console.log('[Papr] shouldShowOverlay returned false')
  }
})

chrome.runtime.onMessage.addListener(
  (
    message: { action: string; payload?: Partial<Settings> },
    sender: chrome.runtime.MessageSender,
  ) => {
    console.log('[Papr] received message:', message.action)
    if (sender.id !== chrome.runtime.id) return

    if (message.action === MSG.PREVIEW_INTENSITY) {
      const intensity = message.payload?.intensity
      if (typeof intensity === 'number' && isFinite(intensity)) updateIntensity(intensity)
      return
    }

    if (message.action !== MSG.SETTINGS_UPDATED || !message.payload) return
    const s = coerceSettings(message.payload)
    console.log('[Papr] SETTINGS_UPDATED, enabled:', s.enabled, 'hasOverlay:', !!getOverlayElement())

    if (!s.enabled) {
      removeOverlay()
      return
    }

    if (!getOverlayElement()) {
      createOverlay(s)
      return
    }

    updateIntensity(s.intensity)
    updateTexture(s)
    updateBlendMode()
  },
)

let lastReinject = 0

const observer = new MutationObserver((mutations) => {
  const now = Date.now()
  if (now - lastReinject < 1000) return
  for (const mutation of mutations) {
    for (const node of mutation.removedNodes) {
      if ((node as HTMLElement).id === OVERLAY_ID) {
        lastReinject = now
        chrome.storage.sync.get(STORAGE_KEY, (result) => {
          const settings = coerceSettings(result[STORAGE_KEY] as Partial<Settings> | undefined)
          if (shouldShowOverlay(settings)) createOverlay(settings)
        })
        return
      }
    }
  }
})

observer.observe(document.documentElement, { childList: true })
