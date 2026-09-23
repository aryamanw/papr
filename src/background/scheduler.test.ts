import { describe, it, expect } from 'vitest'
import { getDayOfYear, calculateSunriseSunset } from './scheduler'

describe('getDayOfYear', () => {
  it('returns 1 for Jan 1', () => {
    expect(getDayOfYear(new Date(2026, 0, 1))).toBe(1)
  })

  it('returns 365 for Dec 31 (non-leap year)', () => {
    expect(getDayOfYear(new Date(2026, 11, 31))).toBe(365)
  })

  it('returns 366 for Dec 31 (leap year)', () => {
    expect(getDayOfYear(new Date(2024, 11, 31))).toBe(366)
  })
})

describe('calculateSunriseSunset', () => {
  it('returns Date objects with sunrise before sunset', () => {
    const { sunrise, sunset } = calculateSunriseSunset(40, new Date(2026, 5, 21))
    expect(sunrise.getTime()).toBeLessThan(sunset.getTime())
  })

  it('returns times within valid range (0-24h local)', () => {
    const { sunrise, sunset } = calculateSunriseSunset(40, new Date(2026, 5, 21))
    expect(sunrise.getHours()).toBeGreaterThanOrEqual(0)
    expect(sunrise.getHours()).toBeLessThan(24)
    expect(sunset.getHours()).toBeGreaterThanOrEqual(0)
    expect(sunset.getHours()).toBeLessThan(24)
  })

  it('returns winter day shorter than summer day', () => {
    const summer = calculateSunriseSunset(40, new Date(2026, 5, 21))
    const winter = calculateSunriseSunset(40, new Date(2026, 11, 21))
    const summerDay = summer.sunset.getTime() - summer.sunrise.getTime()
    const winterDay = winter.sunset.getTime() - winter.sunrise.getTime()
    expect(summerDay).toBeGreaterThan(winterDay)
  })

  it('equator has roughly equal days year-round', () => {
    const june = calculateSunriseSunset(0, new Date(2026, 5, 21))
    const dec = calculateSunriseSunset(0, new Date(2026, 11, 21))
    const juneDay = june.sunset.getTime() - june.sunrise.getTime()
    const decDay = dec.sunset.getTime() - dec.sunrise.getTime()
    const diff = Math.abs(juneDay - decDay)
    expect(diff).toBeLessThan(3600000) // within 1 hour
  })
})
