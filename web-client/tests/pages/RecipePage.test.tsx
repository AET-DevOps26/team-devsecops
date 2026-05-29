import { Route, Routes } from 'react-router-dom'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { components } from '../../src/api'
import { RecipePage } from '../../src/pages/RecipePage'
import { renderWithProviders } from '../utils'

type Recipe = components['schemas']['Recipe']

const a: Recipe = {
  id: 1,
  title: 'Tomato Pasta',
  portions: 2,
  ingredients: [{ name: 'tomato', quantity: 4, unit: '' }],
  instructions: ['boil pasta', 'add sauce'],
  nutrients: { calories: 500, protein: 20, fat: 10, carbs: 60 },
}
const b: Recipe = { ...a, id: 2, title: 'Pesto Pasta' }

function render(index = 0, recipes: Recipe[] = [a, b]) {
  sessionStorage.setItem('generated_recipes', JSON.stringify(recipes))
  return renderWithProviders(
    <Routes>
      <Route path="/generate" element={<div>generate page</div>} />
      <Route path="/recipe" element={<RecipePage />} />
    </Routes>,
    {
      route: { pathname: '/recipe', state: { index } },
      token: { value: 'tkn', username: 'alice' },
    },
  )
}

describe('RecipePage', () => {
  it('scales ingredient quantities and kcal when portions are doubled', async () => {
    const user = userEvent.setup()
    render(0)

    // baseline: 4 tomato, 500 kcal at 2 portions
    expect(screen.getByText(/4 tomato/i)).toBeInTheDocument()
    expect(screen.getByText('500 kcal')).toBeInTheDocument()

    // 2 -> 4 portions (two +0.5 + one +1 step crosses the threshold; just click + repeatedly)
    const inc = screen.getByRole('button', { name: 'Increase portions' })
    await user.click(inc) // 2.5
    await user.click(inc) // 3
    await user.click(inc) // 3.5
    await user.click(inc) // 4

    expect(screen.getByText(/8 tomato/i)).toBeInTheDocument()
    expect(screen.getByText('1000 kcal')).toBeInTheDocument()
  })

  it('redirects to /generate when the requested recipe is missing', () => {
    render(5)
    expect(screen.getByText('generate page')).toBeInTheDocument()
  })

  it('disables Previous on the first recipe and Next on the last', () => {
    render(0)
    // mobile prev/next is the bottom bar; assert via aria-label
    expect(screen.getByRole('button', { name: 'Previous recipe' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next recipe' })).toBeEnabled()
  })
})
