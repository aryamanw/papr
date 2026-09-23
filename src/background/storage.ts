import { STORAGE_KEY } from '../shared/constants'
import { coerceSettings } from '../shared/validate'
import type { Settings } from '../shared/types'

function applyTextureMigration(raw: Partial<Settings>): { data: Partial<Settings>; migrated: boolean } {
  const texture = raw.texture as string | undefined
  if (texture === 'classic-matte') return { data: { ...raw, texture: 'print-paper' }, migrated: true }
  if (texture === 'whisper-weave') return { data: { ...raw, texture: 'woven-fabric' }, migrated: true }
  return { data: raw, migrated: false }
}

export function readSettings(): Promise<Settings> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(STORAGE_KEY, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      const raw = result[STORAGE_KEY] as Partial<Settings> | undefined
      const { data, migrated } = applyTextureMigration(raw ?? {})
      const settings = coerceSettings(data)
      if (migrated) {
        chrome.storage.sync.set({ [STORAGE_KEY]: settings }, () => {
          if (chrome.runtime.lastError) {
            console.warn('[Papr] migration write-back encountered an error')
          }
        })
      }
      resolve(settings)
    })
  })
}

export function writeSettings(settings: Settings): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ [STORAGE_KEY]: settings }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      resolve()
    })
  })
}

export async function mergeSettings(partial: Partial<Settings>): Promise<Settings> {
  const current = await readSettings()
  const merged = coerceSettings({ ...current, ...partial })
  await writeSettings(merged)
  return merged
}
