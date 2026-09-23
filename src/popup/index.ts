import type { Settings } from '../shared/types'
import { MSG, SLIDER_MIN, SLIDER_MAX, DEFAULT_SETTINGS } from '../shared/constants'

let current: Settings | null = null
let currentTabId: number | null = null

const toggleEl         = document.getElementById('toggle')           as HTMLButtonElement
const controlsEl       = document.getElementById('controls')         as HTMLDivElement
const pickerEl         = document.getElementById('texture-picker')   as HTMLDivElement
const sliderEl         = document.getElementById('intensity-slider') as HTMLInputElement
const valueEl          = document.getElementById('intensity-value')  as HTMLSpanElement
const onboardingEl     = document.getElementById('onboarding')       as HTMLDivElement
const onboardingDismiss = document.getElementById('onboarding-dismiss') as HTMLButtonElement

function intensityToPct(v: number): number {
  return Math.round(v * 100)
}

function pctToIntensity(v: number): number {
  return v / 100
}

function updateSliderFill(pct: number): void {
  const range  = (SLIDER_MAX - SLIDER_MIN) * 100
  const offset = SLIDER_MIN * 100
  const fillPct = ((pct - offset) / range) * 100
  sliderEl.style.setProperty('--fill-pct', `${fillPct}%`)
}

function render(settings: Settings): void {
  current = settings

  toggleEl.setAttribute('aria-checked', String(settings.enabled))
  controlsEl.classList.toggle('controls--disabled', !settings.enabled)

  pickerEl.querySelectorAll<HTMLElement>('[data-texture]').forEach((card) => {
    const selected = card.dataset.texture === settings.texture
    card.classList.toggle('texture-card--selected', selected)
    card.setAttribute('aria-checked', String(selected))
  })

  const pct = intensityToPct(settings.intensity)
  sliderEl.value = String(pct)
  sliderEl.setAttribute('aria-valuenow', String(pct))
  valueEl.textContent = `${pct}%`
  updateSliderFill(pct)
}

function send(payload: Partial<Settings>): void {
  chrome.runtime.sendMessage({ action: MSG.UPDATE_SETTINGS, payload })
}

// ── Toggle ──
toggleEl.addEventListener('click', () => {
  if (!current) return
  const next = { ...current, enabled: !current.enabled }
  send({ enabled: next.enabled })
  render(next)
})

// ── Texture picker ──
pickerEl.addEventListener('click', (e) => {
  const card = (e.target as HTMLElement).closest<HTMLElement>('[data-texture]')
  if (!card || !current) return
  const texture = card.dataset.texture as Settings['texture']
  send({ texture })
  render({ ...current, texture })
})

// Arrow-key navigation within the radiogroup (ARIA pattern)
pickerEl.addEventListener('keydown', (e) => {
  const isArrow = e.key === 'ArrowRight' || e.key === 'ArrowLeft'
                || e.key === 'ArrowDown'  || e.key === 'ArrowUp'
  if (!isArrow) return
  const cards = Array.from(pickerEl.querySelectorAll<HTMLElement>('[role="radio"]'))
  const idx   = cards.indexOf(document.activeElement as HTMLElement)
  if (idx === -1) return
  e.preventDefault()
  const delta = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1
  const next  = (idx + delta + cards.length) % cards.length
  cards[next].focus()
})

// ── Intensity slider ──
function sendPreviewToActiveTab(intensity: number): void {
  if (currentTabId === null) return
  chrome.tabs
    .sendMessage(currentTabId, { action: MSG.PREVIEW_INTENSITY, payload: { intensity } })
    .catch(() => undefined)
}

sliderEl.addEventListener('input', () => {
  const pct = Number(sliderEl.value)
  sliderEl.setAttribute('aria-valuenow', String(pct))
  valueEl.textContent = `${pct}%`
  updateSliderFill(pct)
  if (current?.enabled) {
    sendPreviewToActiveTab(pctToIntensity(pct))
  }
})

sliderEl.addEventListener('change', () => {
  if (!current) return
  const intensity = pctToIntensity(Number(sliderEl.value))
  send({ intensity })
  current = { ...current, intensity }
})

// ── Onboarding ──
async function checkOnboarding(): Promise<void> {
  const result = await new Promise<Record<string, unknown>>((resolve) => {
    chrome.storage.local.get(['onboardingDismissed'], resolve)
  })
  if (!result['onboardingDismissed']) {
    onboardingEl.removeAttribute('hidden')
  }
}

onboardingDismiss.addEventListener('click', () => {
  onboardingEl.setAttribute('hidden', '')
  chrome.storage.local.set({ onboardingDismissed: true })
})

// ── Init ──
async function init(): Promise<void> {
  const settingsPromise = new Promise<Settings>((resolve) => {
    chrome.runtime.sendMessage({ action: MSG.GET_SETTINGS }, (s) => {
      if (chrome.runtime.lastError) {
        resolve({ ...DEFAULT_SETTINGS, enabled: false })
      } else {
        resolve(s as Settings)
      }
    })
  })

  const tabPromise = new Promise<number | null>((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError || !tabs?.length) {
        resolve(null)
        return
      }
      resolve(tabs[0]?.id ?? null)
    })
  })

  const [settings, tabId] = await Promise.all([settingsPromise, tabPromise])
  currentTabId = tabId
  render(settings)
  checkOnboarding()
}

init()
