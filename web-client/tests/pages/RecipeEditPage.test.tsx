import type {InitialEntry, RouteObject} from 'react-router-dom'
import {createMemoryRouter, createRoutesFromElements, Outlet, Route, RouterProvider} from 'react-router-dom'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {afterEach, beforeEach, vi} from 'vitest'
import type {components} from '../../src/api'
import {AuthProvider} from '../../src/auth'
import {RecipeEditPage} from '../../src/pages/RecipeEditPage'
import {RecipeGenerationProvider} from '../../src/recipeGeneration'
import {jsonResponse} from '../utils'

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

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
	vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
	fetchMock.mockReset()
	vi.unstubAllGlobals()
	sessionStorage.clear()
})

// mirrors the provider above the tab layout that holds the shared recipe list
function GenerateContext() {
	return (
		<RecipeGenerationProvider>
			<Outlet/>
		</RecipeGenerationProvider>
	)
}

// RecipeEditPage uses useBlocker, which requires a data router.
function renderRouter(routes: RouteObject[], initialEntries: InitialEntry[]) {
	localStorage.setItem('auth_token', 'tkn')
	localStorage.setItem('auth_username', 'alice')
	const router = createMemoryRouter(routes, {initialEntries})
	render(
		<AuthProvider>
			<RouterProvider router={router}/>
		</AuthProvider>,
	)
}

function renderGeneratedEdit(recipes: Recipe[], index = 0) {
	// the provider seeds its recipe list from session storage
	sessionStorage.setItem('generated_recipes', JSON.stringify(recipes))
	renderRouter(
		createRoutesFromElements(
			<Route path="/generate" element={<GenerateContext/>}>
				<Route path="recipe" element={<div>view page</div>}/>
				<Route path="recipe/edit" element={<RecipeEditPage/>}/>
			</Route>,
		),
		[{pathname: '/generate/recipe/edit', state: {index}}],
	)
}

function renderLibraryEdit(recipeId: number) {
	renderRouter(
		createRoutesFromElements(
			<>
				<Route path="/library/recipe/:recipeId" element={<div>view page</div>}/>
				<Route path="/library/recipe/:recipeId/edit" element={<RecipeEditPage/>}/>
			</>,
		),
		[`/library/recipe/${recipeId}/edit`],
	)
}

describe('RecipeEditPage', () => {
	it('edits a saved recipe and PUTs the full payload, then returns to the view', async () => {
		const user = userEvent.setup()
		fetchMock.mockResolvedValueOnce(jsonResponse(a)) // initial GET
		renderLibraryEdit(1)

		const title = await screen.findByDisplayValue('Tomato Pasta')
		await user.clear(title)
		await user.type(title, 'Tomato Pasta Deluxe')

		// add a second ingredient (must carry a positive quantity to be valid)
		await user.click(screen.getByRole('button', {name: 'Add ingredient'}))
		const qtys = screen.getAllByLabelText('Qty')
		await user.type(qtys[qtys.length - 1], '2')
		const names = screen.getAllByLabelText('Ingredient')
		await user.type(names[names.length - 1], 'basil')

		fetchMock.mockResolvedValueOnce(jsonResponse({...a, title: 'Tomato Pasta Deluxe'})) // PUT
		await user.click(screen.getByRole('button', {name: 'Save'}))

		const putCall = fetchMock.mock.calls.find(([, opts]) => opts?.method === 'PUT')!
		expect(String(putCall[0])).toContain('/recipes/1')
		const body = JSON.parse(String(putCall[1]!.body))
		expect(body.title).toBe('Tomato Pasta Deluxe')
		expect(body.portions).toBe(2)
		expect(body.ingredients).toEqual([
			{name: 'tomato', quantity: 4, unit: 'pcs'},
			{name: 'basil', quantity: 2, unit: ''},
		])
		expect(body.nutrients).toEqual({calories: 500, protein: 20, fat: 10, carbs: 60})

		// navigated back to the view
		expect(await screen.findByText('view page')).toBeInTheDocument()
	})

	it('drops fully-blank ingredient and instruction rows on save', async () => {
		const user = userEvent.setup()
		fetchMock.mockResolvedValueOnce(jsonResponse(a))
		renderLibraryEdit(1)
		await screen.findByDisplayValue('Tomato Pasta')

		await user.click(screen.getByRole('button', {name: 'Add ingredient'}))
		await user.click(screen.getByRole('button', {name: 'Add step'}))

		fetchMock.mockResolvedValueOnce(jsonResponse(a))
		await user.click(screen.getByRole('button', {name: 'Save'}))

		const putCall = fetchMock.mock.calls.find(([, opts]) => opts?.method === 'PUT')!
		const body = JSON.parse(String(putCall[1]!.body))
		expect(body.ingredients).toEqual([{name: 'tomato', quantity: 4, unit: 'pcs'}])
		expect(body.instructions).toEqual(['boil pasta', 'add sauce'])
	})

	it('disables Save and flags fields with a red border when counts are invalid', async () => {
		const user = userEvent.setup()
		fetchMock.mockResolvedValueOnce(jsonResponse(a))
		renderLibraryEdit(1)

		const title = await screen.findByDisplayValue('Tomato Pasta')
		expect(screen.getByRole('button', {name: 'Save'})).toBeEnabled()

		// empty title → error
		await user.clear(title)
		expect(title.className).toContain('border-red-500')
		expect(screen.getByRole('button', {name: 'Save'})).toBeDisabled()
		await user.type(title, 'Fixed')
		expect(screen.getByRole('button', {name: 'Save'})).toBeEnabled()

		// zero portions → error
		const portions = screen.getByLabelText('Portions')
		await user.clear(portions)
		await user.type(portions, '0')
		expect(portions.className).toContain('border-red-500')
		expect(screen.getByRole('button', {name: 'Save'})).toBeDisabled()
		await user.clear(portions)
		await user.type(portions, '2')

		// empty nutrient → error
		const calories = screen.getByLabelText('Calories')
		await user.clear(calories)
		expect(calories.className).toContain('border-red-500')
		expect(screen.getByRole('button', {name: 'Save'})).toBeDisabled()
	})

	it('estimates nutrients from the live draft, sending the recipe without its nutrients', async () => {
		const user = userEvent.setup()
		fetchMock.mockResolvedValueOnce(jsonResponse(a)) // initial GET
		renderLibraryEdit(1)

		// edit an ingredient first: the estimate must reflect the draft, not the fetched recipe
		const names = await screen.findAllByLabelText('Ingredient')
		await user.clear(names[0])
		await user.type(names[0], 'aubergine')

		fetchMock.mockResolvedValueOnce(jsonResponse({calories: 123, protein: 7, fat: 4, carbs: 15}))
		await user.click(screen.getByRole('button', {name: 'Estimate using AI'}))

		const postCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/ai/nutrients'))!
		const body = JSON.parse(String(postCall[1]!.body))
		expect(body.recipe).toEqual({
			title: 'Tomato Pasta',
			portions: 2,
			ingredients: [{name: 'aubergine', quantity: 4, unit: 'pcs'}],
			instructions: ['boil pasta', 'add sauce'],
		})
		expect(body.recipe).not.toHaveProperty('nutrients')

		// the fixture's nutrients (500/20/10/60) are overwritten unconditionally
		expect(await screen.findByDisplayValue('123')).toBeInTheDocument()
		expect(screen.getByLabelText('Protein')).toHaveValue(7)
		expect(screen.getByLabelText('Fat')).toHaveValue(4)
		expect(screen.getByLabelText('Carbs')).toHaveValue(15)
	})

	it('accepts a zero nutrient estimate and stays saveable', async () => {
		const user = userEvent.setup()
		fetchMock.mockResolvedValueOnce(jsonResponse(a))
		renderLibraryEdit(1)
		await screen.findByDisplayValue('Tomato Pasta')

		fetchMock.mockResolvedValueOnce(jsonResponse({calories: 0, protein: 0, fat: 0, carbs: 0}))
		await user.click(screen.getByRole('button', {name: 'Estimate using AI'}))

		const fat = await screen.findByLabelText('Fat')
		expect(fat).toHaveValue(0)
		expect(fat.className).not.toContain('border-red-500')
		expect(screen.getByRole('button', {name: 'Save'})).toBeEnabled()
	})

	it('shows an error in the nutrients card when the estimate fails, keeping the values', async () => {
		const user = userEvent.setup()
		fetchMock.mockResolvedValueOnce(jsonResponse(a))
		renderLibraryEdit(1)
		await screen.findByDisplayValue('Tomato Pasta')

		fetchMock.mockResolvedValueOnce(jsonResponse({message: 'GenAI service unavailable'}, {status: 502}))
		await user.click(screen.getByRole('button', {name: 'Estimate using AI'}))

		expect(await screen.findByText(/GenAI service unavailable/)).toBeInTheDocument()
		expect(screen.getByLabelText('Calories')).toHaveValue(500)
		expect(screen.getByRole('button', {name: 'Estimate using AI'})).toBeEnabled()
	})

	it('disables the estimate button until the recipe itself is complete', async () => {
		const user = userEvent.setup()
		fetchMock.mockResolvedValueOnce(jsonResponse(a))
		renderLibraryEdit(1)

		const title = await screen.findByDisplayValue('Tomato Pasta')
		expect(screen.getByRole('button', {name: 'Estimate using AI'})).toBeEnabled()

		// a blank title cannot be sent
		await user.clear(title)
		expect(screen.getByRole('button', {name: 'Estimate using AI'})).toBeDisabled()
		await user.type(title, 'Tomato Pasta')

		// the contract requires at least one ingredient (minItems: 1)
		await user.click(screen.getByRole('button', {name: 'Remove ingredient'}))
		expect(screen.getByRole('button', {name: 'Estimate using AI'})).toBeDisabled()
	})

	it('keeps an edited unsaved recipe as a draft without any network call', async () => {
		const user = userEvent.setup()
		const unsaved = {...a, id: undefined} as unknown as Recipe
		renderGeneratedEdit([unsaved])

		const title = await screen.findByDisplayValue('Tomato Pasta')
		await user.clear(title)
		await user.type(title, 'My Draft Pasta')
		await user.click(screen.getByRole('button', {name: 'Save'}))

		// unsaved recipe asks whether to persist
		await user.click(screen.getByRole('button', {name: 'Keep as draft'}))

		expect(fetchMock).not.toHaveBeenCalled()
		expect(await screen.findByText('view page')).toBeInTheDocument()
	})

	it('persists an edited unsaved recipe to the library via POST', async () => {
		const user = userEvent.setup()
		const unsaved = {...a, id: undefined} as unknown as Recipe
		renderGeneratedEdit([unsaved])

		const title = await screen.findByDisplayValue('Tomato Pasta')
		await user.clear(title)
		await user.type(title, 'Saved Pasta')
		await user.click(screen.getByRole('button', {name: 'Save'}))

		fetchMock.mockResolvedValueOnce(jsonResponse({id: 7}))
		await user.click(screen.getByRole('button', {name: 'Save to library'}))

		const postCall = fetchMock.mock.calls.find(
			([url, opts]) => opts?.method === 'POST' && String(url).endsWith('/recipes'),
		)!
		const body = JSON.parse(String(postCall[1]!.body))
		expect(body.title).toBe('Saved Pasta')
		expect(await screen.findByText('view page')).toBeInTheDocument()
	})

	it('warns before discarding unsaved edits when navigating away', async () => {
		const user = userEvent.setup()
		fetchMock.mockResolvedValueOnce(jsonResponse(a))
		renderLibraryEdit(1)

		const title = await screen.findByDisplayValue('Tomato Pasta')
		await user.clear(title)
		await user.type(title, 'Changed')

		// Cancel is blocked because there are unsaved edits
		await user.click(screen.getByRole('button', {name: 'Cancel'}))
		expect(await screen.findByText('Discard edits?')).toBeInTheDocument()
		expect(screen.queryByText('view page')).not.toBeInTheDocument()

		// keep editing dismisses the dialog and stays
		await user.click(screen.getByRole('button', {name: 'Keep editing'}))
		expect(screen.queryByText('Discard edits?')).not.toBeInTheDocument()
		expect(screen.queryByText('view page')).not.toBeInTheDocument()

		// discarding proceeds with the navigation
		await user.click(screen.getByRole('button', {name: 'Cancel'}))
		await user.click(screen.getByRole('button', {name: 'Discard'}))
		expect(await screen.findByText('view page')).toBeInTheDocument()
	})

	it('navigates away without a prompt when nothing was edited', async () => {
		const user = userEvent.setup()
		fetchMock.mockResolvedValueOnce(jsonResponse(a))
		renderLibraryEdit(1)
		await screen.findByDisplayValue('Tomato Pasta')

		await user.click(screen.getByRole('button', {name: 'Cancel'}))
		expect(await screen.findByText('view page')).toBeInTheDocument()
		expect(screen.queryByText('Discard edits?')).not.toBeInTheDocument()
	})
})
