import { Route, Routes } from 'react-router-dom'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, vi } from 'vitest'
import type { components } from '../../src/api'
import { GeneratePage } from '../../src/pages/GeneratePage'
import { jsonResponse, renderWithProviders } from '../utils'

type Recipe = components['schemas']['Recipe']

const recipe: Recipe = {
  id: 1,
  title: 'Tomato Pasta',
  portions: 2,
  ingredients: [{ name: 'tomato', quantity: 4, unit: 'pcs' }],
  instructions: ['boil pasta', 'add sauce'],
  nutrients: { calories: 0, protein: 0, fat: 0, carbs: 0 },
}

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

function render() {
  renderWithProviders(
    <Routes>
      <Route path="/generate" element={<GeneratePage />} />
    </Routes>,
    { route: '/generate', token: { value: 'tkn', username: 'alice' } },
  )
}

describe('GeneratePage', () => {
  it('restores previously generated recipes from sessionStorage', () => {
    sessionStorage.setItem('generated_recipes', JSON.stringify([recipe]))

    render()

    expect(screen.getByText('Tomato Pasta')).toBeInTheDocument()
    expect(screen.getByText('2 portions')).toBeInTheDocument()
  })

  it('shows the "No recipes returned" message when the server returns an empty list', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]))
    const user = userEvent.setup()
    render()

    await user.type(screen.getByPlaceholderText(/What do you want to cook/i), 'anything')
    await user.click(screen.getByRole('button', { name: 'Generate' }))

    expect(await screen.findByText('No recipes returned.')).toBeInTheDocument()
  })

  it('shows a server error and clears the loading state', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'GenAI down' }, { status: 503 }))
    const user = userEvent.setup()
    render()

    await user.type(screen.getByPlaceholderText(/What do you want to cook/i), 'pasta')
    await user.click(screen.getByRole('button', { name: 'Generate' }))

    expect(await screen.findByText('Error: GenAI down')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Generate' })).toBeEnabled()
  })
})
