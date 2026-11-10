import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { WeatherLayer, weathers } from './WeatherLayer'

describe('WeatherLayer', () => {
  it.each(weathers)('renders %s', (weather) => {
    const { container } = render(
      <svg>
        <WeatherLayer weather={weather} />
      </svg>,
    )
    expect(container.querySelector(`[data-weather="${weather}"]`)).not.toBeNull()
  })
})
