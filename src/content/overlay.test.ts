import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createOverlay, removeOverlay, updateIntensity, updateTexture,
  getOverlayElement, relativeLuminance, sampleBackgroundLuminance,
  updateBlendMode,
} from './overlay'
import { DEFAULT_SETTINGS, OVERLAY_ID } from '../shared/constants'

beforeEach(() => {
  document.documentElement.innerHTML = ''
  document.body.style.backgroundColor = ''
})

afterEach(() => {
  removeOverlay()
})

describe('createOverlay', () => {
  it('appends a div with the correct id', () => {
    createOverlay(DEFAULT_SETTINGS)
    expect(document.getElementById(OVERLAY_ID)).not.toBeNull()
  })

  it('sets aria-hidden="true"', () => {
    createOverlay(DEFAULT_SETTINGS)
    expect(document.getElementById(OVERLAY_ID)?.getAttribute('aria-hidden')).toBe('true')
  })

  it('sets pointer-events to none', () => {
    createOverlay(DEFAULT_SETTINGS)
    expect(document.getElementById(OVERLAY_ID)!.style.pointerEvents).toBe('none')
  })

  it('contains an inline SVG element', () => {
    createOverlay(DEFAULT_SETTINGS)
    const el = document.getElementById(OVERLAY_ID)!
    expect(el.children.length).toBe(1)
    expect(el.children[0].tagName.toLowerCase()).toBe('svg')
  })

  it('sets opacity to the intensity value', () => {
    createOverlay({ ...DEFAULT_SETTINGS, intensity: 0.25 })
    expect(document.getElementById(OVERLAY_ID)!.style.opacity).toBe('0.25')
  })

  it('is idempotent — does not duplicate the overlay', () => {
    createOverlay(DEFAULT_SETTINGS)
    createOverlay(DEFAULT_SETTINGS)
    expect(document.querySelectorAll(`#${OVERLAY_ID}`).length).toBe(1)
  })

  it('uses multiply blend mode on a light page', () => {
    document.body.style.backgroundColor = '#ffffff'
    createOverlay(DEFAULT_SETTINGS)
    expect(document.getElementById(OVERLAY_ID)!.style.mixBlendMode).toBe('multiply')
  })

  it('uses screen blend mode on a dark page', () => {
    document.body.style.backgroundColor = '#111111'
    createOverlay(DEFAULT_SETTINGS)
    expect(document.getElementById(OVERLAY_ID)!.style.mixBlendMode).toBe('screen')
  })
})

describe('removeOverlay', () => {
  it('removes the overlay element', () => {
    createOverlay(DEFAULT_SETTINGS)
    removeOverlay()
    expect(document.getElementById(OVERLAY_ID)).toBeNull()
  })

  it('does not throw when overlay is absent', () => {
    expect(() => removeOverlay()).not.toThrow()
  })
})

describe('updateIntensity', () => {
  it('updates the overlay opacity', () => {
    createOverlay(DEFAULT_SETTINGS)
    updateIntensity(0.28)
    expect(document.getElementById(OVERLAY_ID)!.style.opacity).toBe('0.28')
  })

  it('does not throw when overlay is absent', () => {
    expect(() => updateIntensity(0.28)).not.toThrow()
  })
})

describe('updateTexture', () => {
  it('changes the SVG filter when texture changes', () => {
    createOverlay(DEFAULT_SETTINGS)
    const el = document.getElementById(OVERLAY_ID)!
    const before = el.querySelector('svg')!.innerHTML
    updateTexture({ ...DEFAULT_SETTINGS, texture: 'woven-fabric' })
    const after = el.querySelector('svg')!.innerHTML
    expect(after).not.toBe(before)
    expect(after.length).toBeGreaterThan(0)
  })

  it('does not throw when overlay is absent', () => {
    expect(() => updateTexture(DEFAULT_SETTINGS)).not.toThrow()
  })

  it('uses grayscale texture variant on dark page for warm textures', () => {
    document.body.style.backgroundColor = '#111111'
    createOverlay(DEFAULT_SETTINGS)
    updateTexture({ ...DEFAULT_SETTINGS, texture: 'parchment' })
    const el = document.getElementById(OVERLAY_ID)!
    const svg = el.querySelector('svg')!
    expect(svg.innerHTML).not.toContain('type="matrix"')
    expect(svg.innerHTML).toContain('type="saturate"')
    document.body.style.backgroundColor = ''
  })
})

describe('getOverlayElement', () => {
  it('returns null when overlay is not present', () => {
    expect(getOverlayElement()).toBeNull()
  })

  it('returns the element after createOverlay', () => {
    createOverlay(DEFAULT_SETTINGS)
    expect(getOverlayElement()).not.toBeNull()
  })
})

describe('relativeLuminance', () => {
  it('returns 1.0 for white', () => {
    expect(relativeLuminance(255, 255, 255)).toBeCloseTo(1.0, 2)
  })

  it('returns 0.0 for black', () => {
    expect(relativeLuminance(0, 0, 0)).toBe(0)
  })

  it('returns ~0.216 for middle gray (128)', () => {
    expect(relativeLuminance(128, 128, 128)).toBeCloseTo(0.2158, 3)
  })

  it('returns ~0.033 for dark gray (#333)', () => {
    expect(relativeLuminance(51, 51, 51)).toBeCloseTo(0.033, 2)
  })

  it('returns ~0.058 for #444', () => {
    expect(relativeLuminance(68, 68, 68)).toBeCloseTo(0.058, 2)
  })

  it('returns ~0.94 for off-white (#fdf8f2)', () => {
    expect(relativeLuminance(253, 248, 242)).toBeCloseTo(0.94, 2)
  })
})

describe('sampleBackgroundLuminance', () => {
  it('returns null when body has transparent background', () => {
    document.body.style.backgroundColor = 'transparent'
    expect(sampleBackgroundLuminance()).toBeNull()
  })

  it('returns null when body and html have no explicit background', () => {
    expect(sampleBackgroundLuminance()).toBeNull()
  })

  it('returns ~1.0 for white body background', () => {
    document.body.style.backgroundColor = '#ffffff'
    expect(sampleBackgroundLuminance()!).toBeCloseTo(1.0, 2)
  })

  it('returns dark luminance for #111 background', () => {
    document.body.style.backgroundColor = '#111111'
    expect(sampleBackgroundLuminance()!).toBeLessThan(0.05)
  })

  it('falls back to html background when body is transparent', () => {
    document.body.style.backgroundColor = 'transparent'
    document.documentElement.style.backgroundColor = '#0d1117'
    expect(sampleBackgroundLuminance()!).toBeLessThan(0.05)
    document.documentElement.style.backgroundColor = ''
  })

  it('prefers body over html when both have backgrounds', () => {
    document.body.style.backgroundColor = '#ffffff'
    document.documentElement.style.backgroundColor = '#0d1117'
    expect(sampleBackgroundLuminance()!).toBeCloseTo(1.0, 2)
    document.documentElement.style.backgroundColor = ''
  })
})

describe('updateBlendMode', () => {
  it('does not throw when overlay is absent', () => {
    expect(() => updateBlendMode()).not.toThrow()
  })

  it('sets multiply on a light page', () => {
    document.body.style.backgroundColor = '#ffffff'
    createOverlay(DEFAULT_SETTINGS)
    updateBlendMode()
    expect(document.getElementById(OVERLAY_ID)!.style.mixBlendMode).toBe('multiply')
  })

  it('sets screen on a dark page', () => {
    document.body.style.backgroundColor = '#111111'
    createOverlay(DEFAULT_SETTINGS)
    updateBlendMode()
    expect(document.getElementById(OVERLAY_ID)!.style.mixBlendMode).toBe('screen')
  })
})

describe('getOverlayElement — DOM clobbering resistance', () => {
  it('returns null after removeOverlay even if a same-id element still exists in DOM', () => {
    createOverlay(DEFAULT_SETTINGS)
    removeOverlay()
    // A page script plants a div with the same id
    const fake = document.createElement('div')
    fake.id = OVERLAY_ID
    document.documentElement.appendChild(fake)
    expect(getOverlayElement()).toBeNull()
  })

  it('returns element after createOverlay regardless of pre-existing same-id element', () => {
    // A page script plants a div with the same id before the extension runs
    const fake = document.createElement('div')
    fake.id = OVERLAY_ID
    document.documentElement.appendChild(fake)
    createOverlay(DEFAULT_SETTINGS)
    const el = getOverlayElement()
    expect(el).not.toBeNull()
    // Should be a different element (the one we created, appended after)
    expect(el).not.toBe(fake)
  })
})

describe('updateIntensity — persists to module ref', () => {
  it('updates opacity via the stored module ref, not DOM lookup', () => {
    createOverlay(DEFAULT_SETTINGS)
    updateIntensity(0.40)
    // Verify via getOverlayElement which returns the module ref
    // String(0.40) === '0.4' in JavaScript (trailing zero is stripped)
    expect(getOverlayElement()!.style.opacity).toBe('0.4')
  })
})

describe('removeOverlay — cleans up module ref', () => {
  it('getOverlayElement returns null after removeOverlay', () => {
    createOverlay(DEFAULT_SETTINGS)
    removeOverlay()
    expect(getOverlayElement()).toBeNull()
  })
})
