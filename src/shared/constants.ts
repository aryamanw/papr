import type { Settings } from './types'

export const STORAGE_KEY = 'papr_settings'
export const OVERLAY_ID = 'papr-overlay'
export const SLIDER_MIN = 0.15
export const SLIDER_MAX = 0.50

export const VALID_TEXTURES: Settings['texture'][] = [
  'print-paper',
  'woven-fabric',
  'fine-press',
  'aged-newsprint',
  'torinoko-washi',
  'parchment',
]

export const DEFAULT_SETTINGS: Settings = {
  enabled: false,
  texture: 'print-paper',
  intensity: 0.22,
}

export const MSG = {
  GET_SETTINGS: 'GET_SETTINGS',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  SETTINGS_UPDATED: 'SETTINGS_UPDATED',
  TOGGLE: 'TOGGLE',
  PREVIEW_INTENSITY: 'PREVIEW_INTENSITY',
} as const

export type MsgType = typeof MSG[keyof typeof MSG]
