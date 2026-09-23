import { describe, it, expect } from 'vitest'
import { getTextureSvg } from './textures'

describe('getTextureSvg', () => {
  it('returns SVG inner content with defs and rect', () => {
    const svg = getTextureSvg('print-paper')
    expect(svg).toContain('<defs>')
    expect(svg).toContain('</defs>')
    expect(svg).toContain('<rect')
  })

  it('returns different values for all 6 texture types', () => {
    const svgs = [
      getTextureSvg('print-paper'),
      getTextureSvg('woven-fabric'),
      getTextureSvg('fine-press'),
      getTextureSvg('aged-newsprint'),
      getTextureSvg('torinoko-washi'),
      getTextureSvg('parchment'),
    ]
    expect(new Set(svgs).size).toBe(6)
  })

  it('print-paper SVG contains fractalNoise', () => {
    expect(getTextureSvg('print-paper')).toContain('fractalNoise')
  })

  it('woven-fabric SVG contains turbulence type', () => {
    expect(getTextureSvg('woven-fabric')).toContain('type="turbulence"')
  })

  it('fine-press SVG contains fractalNoise', () => {
    expect(getTextureSvg('fine-press')).toContain('fractalNoise')
  })

  it('aged-newsprint SVG contains warm feColorMatrix', () => {
    expect(getTextureSvg('aged-newsprint')).toContain('type="matrix"')
  })

  it('torinoko-washi SVG contains anisotropic baseFrequency', () => {
    expect(getTextureSvg('torinoko-washi')).toContain('baseFrequency="0.6 0.15"')
  })

  it('parchment SVG contains warm feColorMatrix', () => {
    expect(getTextureSvg('parchment')).toContain('type="matrix"')
  })

  it('all 6 textures contain stitchTiles stitch for seamless tiling', () => {
    const textures = [
      'print-paper', 'woven-fabric', 'fine-press',
      'aged-newsprint', 'torinoko-washi', 'parchment',
    ] as const
    for (const t of textures) {
      expect(getTextureSvg(t)).toContain('stitch')
    }
  })

  it('contains papr-f filter id for internal reference', () => {
    expect(getTextureSvg('print-paper')).toContain('id="papr-f"')
    expect(getTextureSvg('print-paper')).toContain('filter="url(#papr-f)"')
  })

  describe('dark mode textures (isDark = true)', () => {
    it('returns grayscale variant for aged-newsprint in dark mode', () => {
      const light = getTextureSvg('aged-newsprint', false)
      const dark = getTextureSvg('aged-newsprint', true)
      expect(light).toContain('type="matrix"')
      expect(dark).not.toContain('type="matrix"')
      expect(dark).toContain('type="saturate"')
    })

    it('returns grayscale variant for parchment in dark mode', () => {
      const light = getTextureSvg('parchment', false)
      const dark = getTextureSvg('parchment', true)
      expect(light).toContain('type="matrix"')
      expect(dark).not.toContain('type="matrix"')
      expect(dark).toContain('type="saturate"')
    })

    it('returns same result for print-paper regardless of dark mode', () => {
      const light = getTextureSvg('print-paper', false)
      const dark = getTextureSvg('print-paper', true)
      expect(light).toBe(dark)
    })

    it('caches dark and light variants separately', () => {
      const light1 = getTextureSvg('parchment', false)
      const dark1 = getTextureSvg('parchment', true)
      const light2 = getTextureSvg('parchment', false)
      const dark2 = getTextureSvg('parchment', true)
      expect(light1).not.toBe(dark1)
      expect(light1).toBe(light2)
      expect(dark1).toBe(dark2)
    })
  })
})
