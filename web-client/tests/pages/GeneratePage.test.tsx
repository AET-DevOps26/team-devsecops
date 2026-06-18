import { Route, Routes } from 'react-router-dom'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, vi } from 'vitest'
import type { components } from '../../src/api'
import { GenerateFlow, GeneratePage, GenerateResultsPage } from '../../src/pages/GeneratePage'
import { jsonResponse, renderWithProviders } from '../utils'

type Recipe = components['schemas']['Recipe']

const recipe: Recipe = {
	id: 1,
	title: 'Tomato Pasta',
	portions: 2,
	ingredients: [{ name: 'tomato', quantity: 4, unit: 'pcs' }],
	instructions: ['boil pasta', 'add sauce'],
	nutrients: { calories: 0, protein: 0, fat: 0, carbs: 0 },
	createdAt: '2024-01-01T00:00:00Z',
	editedAt: '2024-01-01T00:00:00Z',
}

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
	vi.stubGlobal('fetch', fetchMock)
	fetchMock.mockResolvedValueOnce(jsonResponse({ username: 'alice' }))
})
afterEach(() => {
	fetchMock.mockReset()
	vi.unstubAllGlobals()
})

function render(route = '/generate') {
	renderWithProviders(
		<Routes>
			<Route path="/generate" element={<GenerateFlow />}>
				<Route index element={<GeneratePage />} />
				<Route path="results" element={<GenerateResultsPage />} />
			</Route>
		</Routes>,
		{ route, token: { value: 'tkn', username: 'alice' } },
	)
}

describe('GeneratePage', () => {
	it('restores previously generated recipes from sessionStorage', () => {
		sessionStorage.setItem('generated_recipes', JSON.stringify([recipe]))

		render('/generate/results')

		expect(screen.getByText('Tomato Pasta')).toBeInTheDocument()
		expect(screen.getByText('2 portions')).toBeInTheDocument()
	})

	it('shows the "No recipes returned" message when the server returns an empty list', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse([]))
		const user = userEvent.setup()
		render()

		await user.type(screen.getByPlaceholderText(/Type what you think/i), 'anything')
		await user.click(screen.getByRole('button', { name: 'Generate' }))

		expect(await screen.findByText('No recipes returned.')).toBeInTheDocument()
	})

	it('sends the active UI language with the recipe request', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse([recipe]))
		const user = userEvent.setup()
		render()

		await user.type(screen.getByPlaceholderText(/Type what you think/i), 'pasta')
		await user.click(screen.getByRole('button', { name: 'Generate' }))

		const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')
		expect(post).toBeDefined()
		expect(JSON.parse(post![1]!.body as string)).toMatchObject({
			prompt: expect.stringContaining('pasta'),
			language: 'EN',
		})
	})

	it('shows a server error on the results page', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'GenAI down' }, { status: 503 }))
		const user = userEvent.setup()
		render()

		await user.type(screen.getByPlaceholderText(/Type what you think/i), 'pasta')
		await user.click(screen.getByRole('button', { name: 'Generate' }))

		expect(await screen.findByText('Error: GenAI down')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
	})
})
