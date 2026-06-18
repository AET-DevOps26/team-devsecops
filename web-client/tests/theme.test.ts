import { afterEach, beforeEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { ThemeMode } from '../src/theme'

// mock calls to the OS's dark/light mode
function mockMediaQueryList(isDark: boolean) {
	const listeners = new Set<() => void>()
	const mql = {
		matches: isDark,
		media: '(prefers-color-scheme: dark)',
		addEventListener: (_type: string, cb: () => void) => listeners.add(cb),
		removeEventListener: (_type: string, cb: () => void) => listeners.delete(cb),
		// simulate the OS flipping its colour scheme
		emit(setToDark: boolean) {
			mql.matches = setToDark
			listeners.forEach((cb) => cb())
		},
	}
	vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mql))
	return mql
}

async function loadTheme({ storedTheme, isSystemDark }: { storedTheme?: string; isSystemDark?: boolean } = {}) {
	if (storedTheme !== undefined) localStorage.setItem('theme', storedTheme)
	if (isSystemDark !== undefined) mockMediaQueryList(isSystemDark)
	vi.resetModules()
	return import('../src/theme')
}

const isDark = () => document.documentElement.classList.contains('dark')

beforeEach(() => {
	localStorage.clear()
	document.documentElement.className = ''
})

afterEach(() => {
	vi.unstubAllGlobals()
	vi.resetModules()
})

describe('initial mode', () => {
	it('defaults to AUTO when nothing is stored', async () => {
		const { getThemeMode } = await loadTheme()
		expect(getThemeMode()).toBe('AUTO')
	})

	it('restores a valid stored mode', async () => {
		const { getThemeMode } = await loadTheme({ storedTheme: 'DARK' })
		expect(getThemeMode()).toBe('DARK')
	})

	it('ignores an invalid stored value and falls back to AUTO', async () => {
		const { getThemeMode } = await loadTheme({ storedTheme: 'PURPLE' })
		expect(getThemeMode()).toBe('AUTO')
	})

	it('falls back to AUTO when reading storage throws', async () => {
		const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new Error('blocked')
		})
		const { getThemeMode } = await loadTheme()
		expect(getThemeMode()).toBe('AUTO')
		getItem.mockRestore()
	})
})

describe('applying the dark class on import', () => {
	it('adds the dark class for an explicit DARK mode', async () => {
		await loadTheme({ storedTheme: 'DARK', isSystemDark: false })
		expect(isDark()).toBe(true)
	})

	it('leaves the dark class off for an explicit LIGHT mode even when the OS is dark', async () => {
		await loadTheme({ storedTheme: 'LIGHT', isSystemDark: true })
		expect(isDark()).toBe(false)
	})

	it('follows the OS preference in AUTO mode', async () => {
		await loadTheme({ storedTheme: 'AUTO', isSystemDark: true })
		expect(isDark()).toBe(true)
	})
})

describe('setThemeMode', () => {
	it('updates the mode, persists it, and toggles the dark class', async () => {
		const { setThemeMode, getThemeMode } = await loadTheme({ storedTheme: 'LIGHT', isSystemDark: false })

		setThemeMode('DARK')

		expect(getThemeMode()).toBe('DARK')
		expect(localStorage.getItem('theme')).toBe('DARK')
		expect(isDark()).toBe(true)

		setThemeMode('LIGHT')
		expect(isDark()).toBe(false)
		expect(localStorage.getItem('theme')).toBe('LIGHT')
	})

	it('is a no-op when the mode is unchanged', async () => {
		const { setThemeMode } = await loadTheme({ storedTheme: 'DARK', isSystemDark: false })
		const setItem = vi.spyOn(Storage.prototype, 'setItem')

		setThemeMode('DARK')

		expect(setItem).not.toHaveBeenCalled()
		setItem.mockRestore()
	})
})

describe('following the OS while in AUTO', () => {
	it('retoggles the dark class when the OS scheme changes', async () => {
		const osMock = mockMediaQueryList(false)
		localStorage.setItem('theme', 'AUTO')
		vi.resetModules()
		await import('../src/theme')
		expect(isDark()).toBe(false)

		act(() => osMock.emit(true))
		expect(isDark()).toBe(true)

		act(() => osMock.emit(false))
		expect(isDark()).toBe(false)
	})

	it('ignores OS changes when an explicit mode is set', async () => {
		const osMock = mockMediaQueryList(false)
		localStorage.setItem('theme', 'DARK')
		vi.resetModules()
		await import('../src/theme')
		expect(isDark()).toBe(true)

		act(() => osMock.emit(false))
		expect(isDark()).toBe(true)
	})
})

describe('useThemeMode', () => {
	it('returns the current mode and re-renders on change', async () => {
		const { useThemeMode, setThemeMode } = await loadTheme({ storedTheme: 'LIGHT', isSystemDark: false })

		const { result } = renderHook(() => useThemeMode())
		expect(result.current).toBe('LIGHT')

		act(() => setThemeMode('DARK' as ThemeMode))
		expect(result.current).toBe('DARK')
	})
})
