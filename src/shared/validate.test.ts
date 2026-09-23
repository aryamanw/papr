import { describe, it, expect } from 'vitest'
import { coerceSettings } from './validate'
import { DEFAULT_SETTINGS, SLIDER_MIN, SLIDER_MAX } from './constants'

describe('coerceSettings', () => {
  it('returns DEFAULT_SETTINGS when called with undefined', () => {
    expect(coerceSettings(undefined)).toEqual(DEFAULT_SETTINGS)
  })

  it('returns DEFAULT_SETTINGS when called with empty object', () => {
    expect(coerceSettings({})).toEqual(DEFAULT_SETTINGS)
  })

  it('preserves valid boolean for enabled', () => {
    expect(coerceSettings({ enabled: false }).enabled).toBe(false)
    expect(coerceSettings({ enabled: true }).enabled).toBe(true)
  })

  it('falls back to default enabled when non-boolean', () => {
    expect(coerceSettings({ enabled: 'yes' as unknown as boolean }).enabled).toBe(DEFAULT_SETTINGS.enabled)
    expect(coerceSettings({ enabled: 1 as unknown as boolean }).enabled).toBe(DEFAULT_SETTINGS.enabled)
  })

  it('preserves valid texture', () => {
    expect(coerceSettings({ texture: 'woven-fabric' }).texture).toBe('woven-fabric')
    expect(coerceSettings({ texture: 'parchment' }).texture).toBe('parchment')
  })

  it('falls back to default texture for unknown texture id', () => {
    expect(coerceSettings({ texture: 'unknown-texture' as never }).texture).toBe(DEFAULT_SETTINGS.texture)
    expect(coerceSettings({ texture: '' as never }).texture).toBe(DEFAULT_SETTINGS.texture)
  })

  it('clamps intensity to [SLIDER_MIN, SLIDER_MAX]', () => {
    expect(coerceSettings({ intensity: 0.05 }).intensity).toBe(SLIDER_MIN)
    expect(coerceSettings({ intensity: 0.99 }).intensity).toBe(SLIDER_MAX)
    expect(coerceSettings({ intensity: 0.30 }).intensity).toBe(0.30)
  })

  it('falls back to default intensity for non-finite values', () => {
    expect(coerceSettings({ intensity: NaN }).intensity).toBe(DEFAULT_SETTINGS.intensity)
    expect(coerceSettings({ intensity: Infinity }).intensity).toBe(DEFAULT_SETTINGS.intensity)
  })

  it('handles legacy texture classic-matte via migration', () => {
    expect(coerceSettings({ texture: 'classic-matte' as never }).texture).toBe('print-paper')
  })

  it('handles legacy texture whisper-weave via migration', () => {
    expect(coerceSettings({ texture: 'whisper-weave' as never }).texture).toBe('woven-fabric')
  })
})
