/**
 * Consumer-driven contract test: web-client → spring-api (public REST boundary).
 *
 * Exercises the real client code against a Pact mock
 * server for every route the client uses, and generates a pact. The pact
 * (web-client/pacts/) is later replayed against the running Spring provider.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { MatchersV3, PactV3 } from '@pact-foundation/pact'

const { like, eachLike, integer, regex } = MatchersV3

const MOCK_PORT = 9200

// Loaded after the env is stubbed so the client's base URL points at the mock.
let auth: typeof import('../../src/auth')
let api: typeof import('../../src/useApi')

const pact = new PactV3({
	consumer: 'web-client',
	provider: 'spring-api',
	dir: 'pacts',
	port: MOCK_PORT,
})

// Reusable example shapes matching the OpenAPI schemas.
const bearer = { authorization: regex('Bearer .+', 'Bearer header.payload.signature') }
const jsonHeaders = { 'content-type': 'application/json' }
const jsonResponse = { 'content-type': regex('application/json.*', 'application/json') }

const recipeInputBody = {
	title: 'Pancakes',
	ingredients: [{ quantity: 1, unit: 'cup', name: 'Flour' }],
	instructions: ['Mix the batter.', 'Cook on a griddle.'],
	portions: 2,
	nutrients: { calories: 200, protein: 5, fat: 3, carbs: 35 },
}

const recipeResponseShape = {
	id: integer(1),
	title: like('Pancakes'),
	ingredients: eachLike({ quantity: like(1), unit: like('cup'), name: like('Flour') }),
	instructions: eachLike('Mix the batter.'),
	portions: like(2),
	nutrients: like({ calories: 200, protein: 5, fat: 3, carbs: 35 }),
	createdAt: like('2024-01-01T00:00:00Z'),
	editedAt: like('2024-01-01T00:00:00Z'),
}

beforeAll(async () => {
	vi.stubEnv('VITE_API_BASE', `http://127.0.0.1:${MOCK_PORT}`)
	auth = await import('../../src/auth')
	api = await import('../../src/useApi')
})

afterAll(() => {
	vi.unstubAllEnvs()
})

describe('web-client → spring-api pact', () => {
	it('covers every route the web-client uses', async () => {
		// --- Auth ---
		pact
			.given('no user testuser exists')
			.uponReceiving('a registration request')
			.withRequest({
				method: 'POST',
				path: '/api/v1/users/register',
				headers: jsonHeaders,
				body: { username: 'testuser', password: 'testpass1234' },
			})
			.willRespondWith({ status: 201 })

		pact
			.given('a user testuser exists')
			.uponReceiving('a valid login request')
			.withRequest({
				method: 'POST',
				path: '/api/v1/users/login',
				headers: jsonHeaders,
				body: { username: 'testuser', password: 'testpass1234' },
			})
			.willRespondWith({
				status: 200,
				headers: jsonResponse,
				body: { token: like('header.payload.signature') },
			})

		pact
			.given('a user testuser exists')
			.uponReceiving('a logout request')
			.withRequest({ method: 'POST', path: '/api/v1/users/logout', headers: bearer })
			.willRespondWith({ status: 200 })

		// --- Profile ---
		pact
			.given('a user testuser exists')
			.uponReceiving('an authenticated request for the current user profile')
			.withRequest({ method: 'GET', path: '/api/v1/users/profile', headers: bearer })
			.willRespondWith({
				status: 200,
				headers: jsonResponse,
				body: like({ username: 'testuser', preferences: {} }),
			})

		pact
			.given('a user testuser exists')
			.uponReceiving('a profile update')
			.withRequest({
				method: 'PUT',
				path: '/api/v1/users/profile',
				headers: { ...bearer, ...jsonHeaders },
				body: { preferences: { language: 'EN' } },
			})
			.willRespondWith({ status: 200 })

		pact
			.given('a user testuser exists')
			.uponReceiving('a profile deletion')
			.withRequest({ method: 'DELETE', path: '/api/v1/users/profile', headers: bearer })
			.willRespondWith({ status: 204 })

		// --- Recipes ---
		pact
			.given('a user testuser has a recipe')
			.uponReceiving("a request for the user's recipes")
			.withRequest({ method: 'GET', path: '/api/v1/recipes', headers: bearer })
			.willRespondWith({ status: 200, headers: jsonResponse, body: eachLike(recipeResponseShape) })

		pact
			.given('a user testuser exists')
			.uponReceiving('a request to save a recipe')
			.withRequest({
				method: 'POST',
				path: '/api/v1/recipes',
				headers: { ...bearer, ...jsonHeaders },
				body: recipeInputBody,
			})
			.willRespondWith({ status: 201, headers: jsonResponse, body: { id: integer(1) } })

		pact
			.given('a user testuser has a recipe')
			.uponReceiving('a request for a single recipe by id')
			.withRequest({
				method: 'GET',
				path: '/api/v1/recipes/1',
				headers: bearer,
			})
			.willRespondWith({ status: 200, headers: jsonResponse, body: like(recipeResponseShape) })

		pact
			.given('a user testuser has a recipe')
			.uponReceiving('a request to update a recipe by id')
			.withRequest({
				method: 'PUT',
				path: '/api/v1/recipes/1',
				headers: { ...bearer, ...jsonHeaders },
				body: recipeInputBody,
			})
			.willRespondWith({ status: 200, headers: jsonResponse, body: like(recipeResponseShape) })

		pact
			.given('a user testuser has a recipe')
			.uponReceiving('a request to delete a recipe by id')
			.withRequest({
				method: 'DELETE',
				path: '/api/v1/recipes/1',
				headers: bearer,
			})
			.willRespondWith({ status: 204 })

		// --- GenAI (via the gateway) ---
		pact
			.given('a user testuser exists')
			.uponReceiving('a request to generate recipes')
			.withRequest({
				method: 'POST',
				path: '/api/v1/ai/recipes',
				headers: { ...bearer, ...jsonHeaders },
				body: { prompt: 'something quick with flour', language: 'EN' },
			})
			.willRespondWith({
				status: 200,
				headers: jsonResponse,
				body: eachLike({
					title: like('Pancakes'),
					ingredients: eachLike({ quantity: like(1), unit: like('cup'), name: like('Flour') }),
					instructions: eachLike('Mix the batter.'),
					portions: like(2),
					nutrients: like({ calories: 200, protein: 5, fat: 3, carbs: 35 }),
				}),
			})

		pact
			.given('a user testuser exists')
			.uponReceiving('a request for cooking help')
			.withRequest({
				method: 'POST',
				path: '/api/v1/ai/help',
				headers: { ...bearer, ...jsonHeaders },
				body: { recipe: recipeInputBody, prompt: 'How do I stop it sticking?' },
			})
			.willRespondWith({
				status: 200,
				headers: jsonResponse,
				body: like({ response: 'Grease the pan well.' }),
			})

		// --- Error responses the client branches on ---
		// 401: useApi signs the user out. Distinguishable from the happy path by the
		// absence of a token (Pact can't tell two identical requests apart by state).
		pact
			.given('no authenticated user')
			.uponReceiving('an unauthenticated profile request')
			.withRequest({ method: 'GET', path: '/api/v1/users/profile' })
			.willRespondWith({ status: 401 })

		// 404: RecipePage renders a "not found" state.
		pact
			.given('a user testuser exists')
			.uponReceiving('a request for a recipe that does not exist')
			.withRequest({ method: 'GET', path: '/api/v1/recipes/999', headers: bearer })
			.willRespondWith({ status: 404 })

		// 409: ProfilePage shows "username taken".
		pact
			.given('username taken is registered to another user')
			.uponReceiving('a profile update to an already-taken username')
			.withRequest({
				method: 'PUT',
				path: '/api/v1/users/profile',
				headers: { ...bearer, ...jsonHeaders },
				body: { username: 'taken' },
			})
			.willRespondWith({ status: 409, headers: jsonResponse, body: like({ message: 'Username already taken' }) })

		// 400: ProfilePage shows "invalid request".
		pact
			.given('a user testuser exists')
			.uponReceiving('a profile update with an invalid username')
			.withRequest({
				method: 'PUT',
				path: '/api/v1/users/profile',
				headers: { ...bearer, ...jsonHeaders },
				body: { username: 'invalid name' },
			})
			.willRespondWith({ status: 400 })

		await pact.executeTest(async () => {
			// Unauthenticated request (no token yet) — the client rejects with SessionExpiredError.
			localStorage.clear()
			const noAuthCall = renderHook(() => api.useApi(), { wrapper: auth.AuthProvider }).result.current
			await expect(noAuthCall('/users/profile')).rejects.toThrow()

			// Register auto-logs in and persists the JWT (covers register + login).
			const authHook = renderHook(() => auth.useAuth(), { wrapper: auth.AuthProvider })
			await act(async () => {
				await authHook.result.current.register('testuser', 'testpass1234')
			})
			expect(authHook.result.current.token).toBeTruthy()

			// Authenticated client reads the persisted token and sends it as Bearer.
			const call = renderHook(() => api.useApi(), { wrapper: auth.AuthProvider }).result.current

			// Profile
			expect((await call('/users/profile')).status).toBe(200)
			await call('/users/profile', {
				method: 'PUT',
				headers: jsonHeaders,
				body: JSON.stringify({ preferences: { language: 'EN' } }),
			})

			// Recipes
			expect((await call('/recipes')).status).toBe(200)
			const created = await call('/recipes', {
				method: 'POST',
				headers: jsonHeaders,
				body: JSON.stringify(recipeInputBody),
			})
			expect((await created.json()).id).toBeGreaterThan(0)
			expect((await call('/recipes/1')).status).toBe(200)
			await call('/recipes/1', {
				method: 'PUT',
				headers: jsonHeaders,
				body: JSON.stringify(recipeInputBody),
			})
			expect((await call('/recipes/1', { method: 'DELETE' })).status).toBe(204)

			// GenAI
			const gen = await call('/ai/recipes', {
				method: 'POST',
				headers: jsonHeaders,
				body: JSON.stringify({ prompt: 'something quick with flour', language: 'EN' }),
			})
			expect(Array.isArray(await gen.json())).toBe(true)
			const help = await call('/ai/help', {
				method: 'POST',
				headers: jsonHeaders,
				body: JSON.stringify({ recipe: recipeInputBody, prompt: 'How do I stop it sticking?' }),
			})
			expect((await help.json()).response).toBeTruthy()

			// Error responses (useApi only throws on 401/403, so these return normally).
			expect((await call('/recipes/999')).status).toBe(404)
			expect(
				(
					await call('/users/profile', {
						method: 'PUT',
						headers: jsonHeaders,
						body: JSON.stringify({ username: 'taken' }),
					})
				).status,
			).toBe(409)
			expect(
				(
					await call('/users/profile', {
						method: 'PUT',
						headers: jsonHeaders,
						body: JSON.stringify({ username: 'invalid name' }),
					})
				).status,
			).toBe(400)

			// Logout and account deletion last (deletion removes the user).
			await call('/users/logout', { method: 'POST' })
			expect((await call('/users/profile', { method: 'DELETE' })).status).toBe(204)
		})
	})
})
