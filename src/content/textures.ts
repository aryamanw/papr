import type { TextureType } from '../shared/types'

const FILTERS: Record<TextureType, string> = {
  'print-paper': '<filter id="papr-f"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" seed="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>',
  'woven-fabric': '<filter id="papr-f"><feTurbulence type="turbulence" baseFrequency="0.9" numOctaves="2" seed="5" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>',
  'fine-press': '<filter id="papr-f"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" seed="12" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>',
  'aged-newsprint': '<filter id="papr-f"><feTurbulence type="fractalNoise" baseFrequency="0.45" numOctaves="3" seed="7" stitchTiles="stitch" result="noise"/><feColorMatrix type="matrix" in="noise" values="0.9 0.1 0 0 0.08 0.7 0.8 0.1 0 0.04 0.5 0.1 0.5 0 0 0 0 0 1 0"/></filter>',
  'torinoko-washi': '<filter id="papr-f"><feTurbulence type="fractalNoise" baseFrequency="0.6 0.15" numOctaves="4" seed="11" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>',
  'parchment': '<filter id="papr-f"><feTurbulence type="fractalNoise" baseFrequency="0.35" numOctaves="3" seed="19" stitchTiles="stitch" result="noise"/><feColorMatrix type="matrix" in="noise" values="1.0 0.2 0 0 0.14 0.6 0.9 0.1 0 0.06 0.3 0.1 0.4 0 0 0 0 0 1 0"/></filter>',
}

const FILTERS_DARK: Partial<Record<TextureType, string>> = {
  'aged-newsprint': '<filter id="papr-f"><feTurbulence type="fractalNoise" baseFrequency="0.45" numOctaves="3" seed="7" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>',
  'parchment': '<filter id="papr-f"><feTurbulence type="fractalNoise" baseFrequency="0.35" numOctaves="3" seed="19" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>',
}

const filterCache = new Map<string, string>()

function getFilterMarkup(texture: TextureType, isDark = false): string {
  const cacheKey = texture + (isDark ? '-dark' : '')
  const cached = filterCache.get(cacheKey)
  if (cached) return cached
  const markup = isDark && FILTERS_DARK[texture] ? FILTERS_DARK[texture]! : FILTERS[texture]
  filterCache.set(cacheKey, markup)
  return markup
}

export function getTextureSvg(texture: TextureType, isDark = false): string {
  const filterMarkup = getFilterMarkup(texture, isDark)
  return `<defs>${filterMarkup}</defs><rect width="100%" height="100%" filter="url(#papr-f)"/>`
}
