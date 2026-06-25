import { afterEach, beforeEach, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../src/auth'
import { setThemeMode } from '../src/theme'
import { useUserPreferences } from '../src/useUserPreferences'
import { jsonResponse } from './utils'

const fetchMock = vi.fn<typeof fetch>()

function PrefTestComponent() {
	useUserPreferences()
	return null
}

function renderTestSetup() {
	localStorage.setItem('auth_token', 'tkn')
	localStorage.setItem('auth_username', 'alice')
	return render(
		<MemoryRouter>
			<AuthProvider>
				<PrefTestComponent />
			</AuthProvider>
		</MemoryRouter>,
	)
}

const isDark = () => document.documentElement.classList.contains('dark')

beforeEach(() => {
	localStorage.clear()
	document.documentElement.className = ''
	setThemeMode('LIGHT')
	vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
	fetchMock.mockReset()
	vi.unstubAllGlobals()
})

describe('useUserPreferences', () => {
	it('applies the theme saved in the profile on load', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ username: 'alice', preferences: { theme: 'DARK' } }))

		renderTestSetup()

		await waitFor(() => expect(isDark()).toBe(true))
	})

	it('ignores an invalid stored theme', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ username: 'alice', preferences: { theme: 'PURPLE' } }))

		renderTestSetup()

		await waitFor(() => expect(fetchMock).toHaveBeenCalled())
		expect(isDark()).toBe(false)
	})
})
