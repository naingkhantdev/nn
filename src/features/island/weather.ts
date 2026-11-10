export type Weather = 'sunny' | 'cloudy' | 'rain' | 'storm' | 'rainbow'

/** The island's weather. Always sunny for now; Task 16 derives it from active sulks. */
export function useCurrentWeather(): Weather {
  return 'sunny'
}
