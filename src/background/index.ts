import { readSettings, writeSettings, mergeSettings } from './storage'
import { sendToAllTabs } from '../shared/messages'
import { DEFAULT_SETTINGS, MSG } from '../shared/constants'

import type { Settings } from '../shared/types'

const ACTIVE_ICON: Record<number, string> = {
  16: 'assets/icons/icon-16.png',
  32: 'assets/icons/icon-32.png',
  48: 'assets/icons/icon-48.png',
  128: 'assets/icons/icon-128.png',
}

const INACTIVE_ICON: Record<number, string> = {
  16: 'assets/icons/inactive/icon-16.png',
  32: 'assets/icons/inactive/icon-32.png',
  48: 'assets/icons/inactive/icon-48.png',
  128: 'assets/icons/inactive/icon-128.png',
}

function setExtensionIcon(active: boolean, tabId?: number): void {
  chrome.action.setIcon({ path: active ? ACTIVE_ICON : INACTIVE_ICON, tabId })
}

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    writeSettings(DEFAULT_SETTINGS)
  }
  readSettings().then((settings) => {
    setExtensionIcon(settings.enabled)
  })
})

chrome.runtime.onMessage.addListener(
  (
    message: { action: string; payload?: Record<string, unknown> },
    sender: chrome.runtime.MessageSender,
    sendResponse: (s: unknown) => void,
  ) => {
    if (sender.id !== chrome.runtime.id) return false
    const { action, payload } = message

    if (action === MSG.GET_SETTINGS) {
      readSettings().then(sendResponse)
      return true
    }

    if (action === MSG.UPDATE_SETTINGS && payload) {
      mergeSettings(payload as Partial<Settings>).then((updated) => {
        setExtensionIcon(updated.enabled)
        sendToAllTabs(MSG.SETTINGS_UPDATED, updated)
        sendResponse(updated)
      }).catch((err: Error) => {
        console.warn('[Papr] UPDATE_SETTINGS failed:', err.message)
        sendResponse(null)
      })
      return true
    }

    if (action === MSG.TOGGLE) {
      readSettings().then((settings) => {
        const updated: Settings = { ...settings, enabled: !settings.enabled }
        writeSettings(updated).then(() => {
          setExtensionIcon(updated.enabled)
          sendToAllTabs(MSG.SETTINGS_UPDATED, updated)
          sendResponse(updated)
        }).catch((err: Error) => {
          console.warn('[Papr] TOGGLE write failed:', err.message)
          sendResponse(null)
        })
      })
      return true
    }

    return false
  },
)

const tabHandleTimers = new Map<number, ReturnType<typeof setTimeout>>()

function debouncedHandleTabChange(tabId: number, url?: string): void {
  const existing = tabHandleTimers.get(tabId)
  if (existing) clearTimeout(existing)
  tabHandleTimers.set(tabId, setTimeout(() => {
    tabHandleTimers.delete(tabId)
    handleTabChange(tabId, url)
  }, 50))
}

function handleTabChange(tabId: number, url?: string): void {
  if (!url || !/^https?:\/\//.test(url)) {
    setExtensionIcon(false, tabId)
    return
  }
  readSettings().then((settings) => {
    setExtensionIcon(settings.enabled, tabId)
    chrome.tabs
      .sendMessage(tabId, {
        action: MSG.SETTINGS_UPDATED,
        payload: settings,
      })
      .catch(() => undefined)
  })
}

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => debouncedHandleTabChange(tabId, tab.url))
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') debouncedHandleTabChange(tabId, tab.url)
})
