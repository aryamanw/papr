import type { Settings } from '../shared/types'
import { OVERLAY_ID, SLIDER_MIN, SLIDER_MAX } from '../shared/constants'
import { getTextureSvg } from './textures'

const LUMINANCE_THRESHOLD = 0.25

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

let themeListenerAttached = false
let overlayEl: HTMLElement | null = null
let svgEl: SVGElement | null = null
let lastSettings: Settings | null = null
let styleObserver: MutationObserver | null = null

export function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function bgLuminance(el: HTMLElement): number | null {
  const bg = getComputedStyle(el).backgroundColor
  if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') return null
  const match = bg.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (!match) return null
  return relativeLuminance(+match[1], +match[2], +match[3])
}

export function sampleBackgroundLuminance(): number | null {
  return bgLuminance(document.body) ?? bgLuminance(document.documentElement)
}

export function detectIsDarkPage(): boolean {
  const lum = sampleBackgroundLuminance()
  if (lum !== null) return lum < LUMINANCE_THRESHOLD
  const cs = getComputedStyle(document.documentElement).colorScheme
  if (cs === 'dark' || cs === 'only dark') return true
  if (cs.includes('dark') && window.matchMedia('(prefers-color-scheme: dark)').matches) return true
  return false
}

export function getOverlayElement(): HTMLElement | null {
  if (overlayEl && !overlayEl.isConnected) {
    overlayEl = null
    svgEl = null
    lastSettings = null
  }
  return overlayEl
}

function createSvg(settings: Settings): SVGElement {
  const isDark = detectIsDarkPage()
  const wrapper = document.createElement('div')
  wrapper.innerHTML = `<svg xmlns="${SVG_NAMESPACE}" width="100%" height="100%">${getTextureSvg(settings.texture, isDark)}</svg>`
  return wrapper.firstElementChild as SVGElement
}

function replaceSvg(el: HTMLElement, settings: Settings): void {
  const newSvg = createSvg(settings)
  if (svgEl?.isConnected) {
    svgEl.replaceWith(newSvg)
  } else {
    el.appendChild(newSvg)
  }
  svgEl = newSvg
}

export function createOverlay(settings: Settings): void {
  console.log('[Papr] createOverlay called, overlayEl?.isConnected:', overlayEl?.isConnected)
  if (overlayEl?.isConnected) return
  const el = document.createElement('div')
  el.id = OVERLAY_ID
  el.setAttribute('aria-hidden', 'true')
  lastSettings = settings
  applyStyles(el, settings)
  svgEl = createSvg(settings)
  el.appendChild(svgEl)
  document.documentElement.appendChild(el)
  overlayEl = el
  console.log('[Papr] overlay appended to DOM, child count:', el.children.length)
  ensureThemeListener()
  attachStyleObserver(el)
}

export function removeOverlay(): void {
  styleObserver?.disconnect()
  styleObserver = null
  overlayEl?.remove()
  overlayEl = null
  svgEl = null
  lastSettings = null
}

export function updateIntensity(intensity: number): void {
  const el = getOverlayElement()
  if (!el) return
  const clamped = Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, intensity))
  el.style.opacity = String(clamped)
  if (lastSettings) lastSettings = { ...lastSettings, intensity: clamped }
}

export function updateTexture(settings: Settings): void {
  const el = getOverlayElement()
  if (!el) return
  replaceSvg(el, settings)
  lastSettings = settings
}

export function updateBlendMode(): void {
  const el = getOverlayElement()
  if (el) el.style.mixBlendMode = detectIsDarkPage() ? 'screen' : 'multiply'
}

function handleStyleTamper(): void {
  if (!overlayEl || !lastSettings) return
  styleObserver?.disconnect()
  applyStyles(overlayEl, lastSettings)
  if (overlayEl.isConnected) {
    styleObserver?.observe(overlayEl, { attributes: true, attributeFilter: ['style'] })
  }
}

function attachStyleObserver(el: HTMLElement): void {
  styleObserver?.disconnect()
  const obs = new MutationObserver(handleStyleTamper)
  obs.observe(el, { attributes: true, attributeFilter: ['style'] })
  styleObserver = obs
}

function ensureThemeListener(): void {
  if (themeListenerAttached) return
  try {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateBlendMode)
    themeListenerAttached = true
  } catch {
    // matchMedia not available (test environment, older browsers)
  }
}

function applyStyles(el: HTMLElement, settings: Settings): void {
  const isDark = detectIsDarkPage()
  el.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:2147483647',
    'pointer-events:none',
    `opacity:${Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, settings.intensity))}`,
    `mix-blend-mode:${isDark ? 'screen' : 'multiply'}`,
  ].join(';')
}
