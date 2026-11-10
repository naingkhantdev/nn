import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Mochi, mochiExpressions } from './Mochi'

describe('Mochi', () => {
  it.each(mochiExpressions)('renders the %s expression', (expression) => {
    render(<Mochi expression={expression} />)
    const el = screen.getByRole('img')
    expect(el).toHaveAttribute('data-expression', expression)
  })
  it('has a label for screen readers', () => {
    render(<Mochi expression="happy" />)
    expect(screen.getByRole('img')).toHaveAccessibleName()
  })
  it('uses the given size', () => {
    render(<Mochi expression="idle" size={96} />)
    expect(screen.getByRole('img')).toHaveAttribute('width', '96')
  })
})
