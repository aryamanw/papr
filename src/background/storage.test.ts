import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readSettings, writeSettings, mergeSettings } from './storage'
import { DEFAULT_SETTINGS, STORAGE_KEY } from '../shared/constants'
import type { Settings } from '../shared/types'

const mockGet = vi.fn()
const mockSet = vi.fn()

beforeEach(() => {
  mockGet.mockReset()
  mockSet.mockReset()
  vi.stubGlobal('chrome', {
    storage: { sync: { get: mockGet, set: mockSet } },
    runtime: { lastError: null },
  })
})

describe('readSettings', () => {
  it('returns DEFAULT_SETTINGS when storage is empty', async () => {
    mockGet.mockImplementation((_key: string, cb: (r: Record<string, unknown>) => void) => cb({}))
    const result = await readSettings()
    expect(result).toEqual(DEFAULT_SETTINGS)
  })

  it('returns stored settings when they exist', async () => {
    const stored: Settings = { ...DEFAULT_SETTINGS, enabled: false, intensity: 0.28 }
    mockGet.mockImplementation((_key: string, cb: (r: Record<string, unknown>) => void) =>
      cb({ [STORAGE_KEY]: stored }),
    )
    const result = await readSettings()
    expect(result).toEqual(stored)
  })
})

describe('writeSettings', () => {
  it('calls chrome.storage.sync.set with the correct key and value', async () => {
    mockSet.mockImplementation((_data: unknown, cb: () => void) => cb())
    await writeSettings(DEFAULT_SETTINGS)
    expect(mockSet).toHaveBeenCalledWith(
      { [STORAGE_KEY]: DEFAULT_SETTINGS },
      expect.any(Function),
    )
  })
})

describe('mergeSettings', () => {
  it('merges partial settings over existing settings', async () => {
    const existing: Settings = { ...DEFAULT_SETTINGS, intensity: 0.22 }
    mockGet.mockImplementation((_key: string, cb: (r: Record<string, unknown>) => void) =>
      cb({ [STORAGE_KEY]: existing }),
    )
    mockSet.mockImplementation((_data: unknown, cb: () => void) => cb())

    const result = await mergeSettings({ intensity: 0.28 })

    expect(result.intensity).toBe(0.28)
    expect(result.enabled).toBe(false)
    expect(result.texture).toBe('print-paper')
  })

  it('does not mutate the original settings object', async () => {
    const existing: Settings = { ...DEFAULT_SETTINGS }
    mockGet.mockImplementation((_key: string, cb: (r: Record<string, unknown>) => void) =>
      cb({ [STORAGE_KEY]: existing }),
    )
    mockSet.mockImplementation((_data: unknown, cb: () => void) => cb())

    await mergeSettings({ enabled: false })

    expect(existing.enabled).toBe(DEFAULT_SETTINGS.enabled)
  })
})

describe('readSettings error handling', () => {
  it('rejects when chrome.runtime.lastError is set', async () => {
    mockGet.mockImplementation((_key: string, cb: (r: Record<string, unknown>) => void) => {
      vi.stubGlobal('chrome', {
        storage: { sync: { get: mockGet, set: mockSet } },
        runtime: { lastError: { message: 'Storage unavailable' } },
      })
      cb({})
    })
    await expect(readSettings()).rejects.toThrow('Storage unavailable')
  })
})

describe('writeSettings error handling', () => {
  it('rejects when chrome.runtime.lastError is set', async () => {
    mockSet.mockImplementation((_data: unknown, cb: () => void) => {
      vi.stubGlobal('chrome', {
        storage: { sync: { get: mockGet, set: mockSet } },
        runtime: { lastError: { message: 'Quota exceeded' } },
      })
      cb()
    })
    await expect(writeSettings(DEFAULT_SETTINGS)).rejects.toThrow('Quota exceeded')
  })
})

describe('readSettings migration', () => {
  it('normalizes classic-matte to print-paper and writes back', async () => {
    const stored = { ...DEFAULT_SETTINGS, texture: 'classic-matte' } as unknown as Settings
    mockGet.mockImplementation((_key: string, cb: (r: Record<string, unknown>) => void) =>
      cb({ [STORAGE_KEY]: stored }),
    )
    mockSet.mockImplementation((_data: unknown, cb: () => void) => cb())

    const result = await readSettings()

    expect(result.texture).toBe('print-paper')
    expect(mockSet).toHaveBeenCalledWith(
      { [STORAGE_KEY]: expect.objectContaining({ texture: 'print-paper' }) },
      expect.any(Function),
    )
  })

  it('normalizes whisper-weave to woven-fabric and writes back', async () => {
    const stored = { ...DEFAULT_SETTINGS, texture: 'whisper-weave' } as unknown as Settings
    mockGet.mockImplementation((_key: string, cb: (r: Record<string, unknown>) => void) =>
      cb({ [STORAGE_KEY]: stored }),
    )
    mockSet.mockImplementation((_data: unknown, cb: () => void) => cb())

    const result = await readSettings()

    expect(result.texture).toBe('woven-fabric')
    expect(mockSet).toHaveBeenCalledWith(
      { [STORAGE_KEY]: expect.objectContaining({ texture: 'woven-fabric' }) },
      expect.any(Function),
    )
  })

  it('does not write back when no migration needed', async () => {
    const stored: Settings = { ...DEFAULT_SETTINGS, texture: 'print-paper' }
    mockGet.mockImplementation((_key: string, cb: (r: Record<string, unknown>) => void) =>
      cb({ [STORAGE_KEY]: stored }),
    )

    await readSettings()

    expect(mockSet).not.toHaveBeenCalled()
  })
})

describe('readSettings validation hardening', () => {
  it('clamps intensity that is below SLIDER_MIN', async () => {
    const stored = { ...DEFAULT_SETTINGS, intensity: 0.01 }
    mockGet.mockImplementation((_key: string, cb: (r: Record<string, unknown>) => void) =>
      cb({ [STORAGE_KEY]: stored }),
    )
    const result = await readSettings()
    expect(result.intensity).toBe(0.15)
  })

  it('rejects unknown texture and falls back to default', async () => {
    const stored = { ...DEFAULT_SETTINGS, texture: 'mystery-texture' }
    mockGet.mockImplementation((_key: string, cb: (r: Record<string, unknown>) => void) =>
      cb({ [STORAGE_KEY]: stored }),
    )
    const result = await readSettings()
    expect(result.texture).toBe('print-paper')
  })

})

describe('mergeSettings validation hardening', () => {
  it('rejects unknown texture in partial and falls back to default', async () => {
    const existing: Settings = { ...DEFAULT_SETTINGS, texture: 'woven-fabric' }
    mockGet.mockImplementation((_key: string, cb: (r: Record<string, unknown>) => void) =>
      cb({ [STORAGE_KEY]: existing }),
    )
    mockSet.mockImplementation((_data: unknown, cb: () => void) => cb())
    const result = await mergeSettings({ texture: 'not-a-texture' as Settings['texture'] })
    expect(result.texture).toBe(DEFAULT_SETTINGS.texture)
  })
})
