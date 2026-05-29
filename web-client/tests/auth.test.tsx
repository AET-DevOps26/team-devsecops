import {act, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, vi} from 'vitest'
import {AuthProvider, useAuth} from '../src/auth'
import {jsonResponse} from './utils'

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
	vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
	fetchMock.mockReset()
	vi.unstubAllGlobals()
})

function DemoSignin() {
	const auth = useAuth()
	return (
		<div>
			<span data-testid="token">{auth.token ?? ''}</span>
			<span data-testid="username">{auth.username ?? ''}</span>
			<button onClick={() => void auth.signIn('alice', 'pw').catch(() => {
			})}>signIn
			</button>
			<button onClick={() => void auth.register('bob', 'pw').catch(() => {
			})}>register
			</button>
			<button onClick={() => auth.signOut()}>signOut</button>
		</div>
	)
}

function setup() {
	render(
		<AuthProvider>
			<DemoSignin/>
		</AuthProvider>,
	)
}

describe('AuthProvider', () => {
	it('persists token and username on signIn and clears them on signOut', async () => {
		setup()

		fetchMock.mockResolvedValueOnce(jsonResponse({token: 'tkn-1'}))
		await act(async () => screen.getByText('signIn').click())
		expect(screen.getByTestId('token')).toHaveTextContent('tkn-1')
		expect(screen.getByTestId('username')).toHaveTextContent('alice')
		expect(localStorage.getItem('auth_token')).toBe('tkn-1')

		fetchMock.mockResolvedValueOnce(new Response(null, {status: 200}))
		await act(async () => screen.getByText('signOut').click())
		expect(screen.getByTestId('token')).toHaveTextContent('')
		expect(localStorage.getItem('auth_token')).toBeNull()
	})

	it('register hits /register then /login and stores the new session', async () => {
		fetchMock
			.mockResolvedValueOnce(new Response(null, {status: 200})) // register
			.mockResolvedValueOnce(jsonResponse({token: 'tkn-2'})) // login
		setup()

		await act(async () => screen.getByText('register').click())

		expect(fetchMock).toHaveBeenCalledTimes(2)
		expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/users/register')
		expect(fetchMock.mock.calls[1][0]).toContain('/api/v1/users/login')
		expect(screen.getByTestId('token')).toHaveTextContent('tkn-2')
		expect(screen.getByTestId('username')).toHaveTextContent('bob')
	})

	it('surfaces the server message on a 401 login', async () => {
		// Arrange
		fetchMock.mockResolvedValueOnce(
			jsonResponse({message: 'Invalid username or password'}, {status: 401}),
		)
		let captured: unknown

		function Catcher() {
			const auth = useAuth()
			return (
				<button
					onClick={() =>
						auth.signIn('alice', 'pw').catch((e) => {
							captured = e
						})
					}
				>
					go
				</button>
			)
		}

		render(
			<AuthProvider>
				<Catcher/>
			</AuthProvider>,
		)

		// Act
		await act(async () => screen.getByText('go').click())

		// Assert
		expect(captured).toBeInstanceOf(Error)
		expect((captured as Error).message).toBe('Invalid username or password')
	})
})
