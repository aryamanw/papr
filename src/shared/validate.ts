import type { Settings } from './types'
import { DEFAULT_SETTINGS, VALID_TEXTURES, SLIDER_MIN, SLIDER_MAX } from './constants'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

const LEGACY_TEXTURE_MAP: Record<string, Settings['texture']> = {
  'classic-matte': 'print-paper',
  'whisper-weave': 'woven-fabric',
}

export function coerceSettings(raw: Partial<Settings> | undefined): Settings {
  const rawTexture = raw?.texture as string | undefined
  const migratedTexture = rawTexture !== undefined
    ? (LEGACY_TEXTURE_MAP[rawTexture] ?? rawTexture)
    : undefined

  return {
    enabled: typeof raw?.enabled === 'boolean'
      ? raw.enabled
      : DEFAULT_SETTINGS.enabled,

    texture: (VALID_TEXTURES as string[]).includes(migratedTexture as string)
      ? migratedTexture as Settings['texture']
      : DEFAULT_SETTINGS.texture,

    intensity: typeof raw?.intensity === 'number' && isFinite(raw.intensity)
      ? clamp(raw.intensity, SLIDER_MIN, SLIDER_MAX)
      : DEFAULT_SETTINGS.intensity,
  }
}
