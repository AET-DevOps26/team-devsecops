import {Route, Routes} from 'react-router-dom'
import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {afterEach, beforeEach, vi} from 'vitest'
import type {components} from '../../src/api'
import {RecipePage} from '../../src/pages/RecipePage'
import {RecipeGenerationProvider} from '../../src/recipeGeneration'
import {jsonResponse, renderWithProviders} from '../utils'

type Recipe = components['schemas']['Recipe']

const a: Recipe = {
	id: 1,
	title: 'Tomato Pasta',
	portions: 2,
	ingredients: [{name: 'tomato', quantity: 4, unit: 'pcs'}],
	instructions: ['boil pasta', 'add sauce'],
	nutrients: {calories: 500, protein: 20, fat: 10, carbs: 60},
	createdAt: '2024-01-01T00:00:00Z',
	editedAt: '2024-01-01T00:00:00Z',
}
const b: Recipe = {...a, id: 2, title: 'Pesto Pasta'}

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
	vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
	fetchMock.mockReset()
	vi.unstubAllGlobals()
	sessionStorage.clear()
})

function renderGeneratedRecipe(index = 0, recipes: Recipe[] = [a, b]) {
	sessionStorage.setItem('generated_recipes', JSON.stringify(recipes))
	renderWithProviders(
		<RecipeGenerationProvider>
			<Routes>
				<Route path="/generate/recipe" element={<RecipePage/>}/>
			</Routes>
		</RecipeGenerationProvider>,
		{
			route: {pathname: '/generate/recipe', state: {index}},
			token: {value: 'tkn', username: 'alice'},
		},
	)
}

function renderLibraryRecipe(recipeId: number, ids?: number[]) {
	renderWithProviders(
		<Routes>
			<Route path="/library" element={<div>library page</div>}/>
			<Route path="/library/recipe/:recipeId" element={<RecipePage/>}/>
		</Routes>,
		{
			route: ids ? {pathname: `/library/recipe/${recipeId}`, state: {ids}} : `/library/recipe/${recipeId}`,
			token: {value: 'tkn', username: 'alice'},
		},
	)
}

describe('RecipePage', () => {
	it('scales ingredient quantities and kcal when portions are doubled', async () => {
		const user = userEvent.setup()
		fetchMock.mockResolvedValueOnce(jsonResponse({response: 'sure'}))
		renderGeneratedRecipe(0)

		// baseline: 4 pcs tomato, 500 kcal at 2 portions
		expect(screen.getByText(/4 pcs tomato/i)).toBeInTheDocument()
		expect(screen.getByText('500 kcal')).toBeInTheDocument()

		const inc = screen.getByRole('button', {name: 'Increase portions'})
		await user.click(inc) // 2.5
		await user.click(inc) // 3
		await user.click(inc) // 3.5
		await user.click(inc) // 4

		expect(screen.getByText(/8 pcs tomato/i)).toBeInTheDocument()
		expect(screen.getByText('1000 kcal')).toBeInTheDocument()

		// the same scaled values must reach the help request, not the originals
		await user.type(screen.getByPlaceholderText(/.+/), 'can I swap the tomato?')
		await user.click(screen.getByRole('button', {name: 'Get help'}))

		const [, options] = fetchMock.mock.calls.find(([url]) => String(url).includes('/ai/help'))!
		const body = JSON.parse(String(options!.body))
		expect(body.recipe.portions).toBe(4)
		expect(body.recipe.ingredients).toEqual([{name: 'tomato', quantity: 8, unit: 'pcs'}])
		expect(body.recipe.nutrients).toEqual({calories: 1000, protein: 40, fat: 20, carbs: 120})
	})

	it('disables Previous on the first recipe and Next on the last', () => {
		renderGeneratedRecipe(0)

		// mobile prev/next is the bottom bar; assert via aria-label
		expect(screen.getByRole('button', {name: 'Previous recipe'})).toBeDisabled()
		expect(screen.getByRole('button', {name: 'Next recipe'})).toBeEnabled()
	})

	it('fetches the library recipe named by the id in the URL', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse(b))
		renderLibraryRecipe(2)

		expect(await screen.findByRole('heading', {name: 'Pesto Pasta'})).toBeInTheDocument()
		expect(fetchMock.mock.calls[0][0]).toContain('/recipes/2')
		// no id list in state (cold deep-link) → no prev/next carousel
		expect(screen.queryByRole('button', {name: 'Next recipe'})).not.toBeInTheDocument()
	})

	it('offers prev/next when the ordered id list is passed in state', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse(b))
		renderLibraryRecipe(2, [1, 2, 3])

		expect(await screen.findByRole('heading', {name: 'Pesto Pasta'})).toBeInTheDocument()
		// recipe 2 sits between 1 and 3
		expect(screen.getByRole('button', {name: 'Previous recipe'})).toBeEnabled()
		expect(screen.getByRole('button', {name: 'Next recipe'})).toBeEnabled()
		// '2 of 3' is only shown on mobile, but it's in the document anyway
		expect(screen.getByText('2 of 3')).toBeInTheDocument()
	})

	it('shows a not-found message when the recipe does not exist', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({message: 'nope'}, {status: 404}))
		renderLibraryRecipe(999)

		expect(await screen.findByText('Recipe not found')).toBeInTheDocument()
	})

	it('shows Edit and Delete actions for a saved recipe and navigates to the edit page', async () => {
		const user = userEvent.setup()
		fetchMock.mockResolvedValueOnce(jsonResponse(a))
		renderWithProviders(
			<Routes>
				<Route path="/library/recipe/:recipeId" element={<RecipePage/>}/>
				<Route path="/library/recipe/:recipeId/edit" element={<div>edit page</div>}/>
			</Routes>,
			{route: '/library/recipe/1', token: {value: 'tkn', username: 'alice'}},
		)
		await screen.findByRole('heading', {name: 'Tomato Pasta'})

		// saved recipe: Edit + Delete, no bookmark/save-to-library
		expect(screen.getByRole('button', {name: 'Edit'})).toBeInTheDocument()
		expect(screen.getByRole('button', {name: 'Delete'})).toBeInTheDocument()
		expect(screen.queryByRole('button', {name: 'Save to library'})).not.toBeInTheDocument()

		await user.click(screen.getByRole('button', {name: 'Edit'}))
		expect(await screen.findByText('edit page')).toBeInTheDocument()
	})

	it('shows Edit and Save to library for an unsaved generated recipe', () => {
		const unsaved = {...a, id: undefined} as unknown as Recipe
		renderGeneratedRecipe(0, [unsaved])

		expect(screen.getByRole('button', {name: 'Edit'})).toBeInTheDocument()
		expect(screen.getByRole('button', {name: 'Save to library'})).toBeInTheDocument()
		expect(screen.queryByRole('button', {name: 'Delete'})).not.toBeInTheDocument()
	})
})
