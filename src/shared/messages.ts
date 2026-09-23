import type { Settings } from './types'

export function sendToAllTabs(action: string, payload: Settings): void {
  chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] }, (tabs) => {
    for (const tab of tabs) {
      if (tab.id !== undefined) {
        chrome.tabs.sendMessage(tab.id, { action, payload }).catch(() => undefined)
      }
    }
  })
}
