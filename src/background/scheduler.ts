export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0)
  return Math.floor((date.getTime() - start.getTime()) / 86400000)
}

export function calculateSunriseSunset(
  latitude: number,
  date: Date,
): { sunrise: Date; sunset: Date } {
  const dayOfYear = getDayOfYear(date)

  const declination = 23.44 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81))

  const latRad = latitude * Math.PI / 180
  const decRad = declination * Math.PI / 180
  const cosHourAngle = -Math.tan(latRad) * Math.tan(decRad)
  const hourAngle = Math.acos(Math.max(-1, Math.min(1, cosHourAngle)))

  const B = (2 * Math.PI / 364) * (dayOfYear - 81)
  const equationOfTime = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B)

  const noon = 720
  const tzOffset = date.getTimezoneOffset()
  const halfDayMinutes = (hourAngle * 720) / Math.PI

  const sunriseMinutes = noon - halfDayMinutes - equationOfTime - tzOffset
  const sunsetMinutes = noon + halfDayMinutes - equationOfTime - tzOffset

  const sunrise = new Date(date)
  sunrise.setHours(0, 0, 0, 0)
  sunrise.setMinutes(sunriseMinutes)

  const sunset = new Date(date)
  sunset.setHours(0, 0, 0, 0)
  sunset.setMinutes(sunsetMinutes)

  return { sunrise, sunset }
}
