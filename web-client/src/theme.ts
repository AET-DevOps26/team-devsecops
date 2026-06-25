import { useSyncExternalStore } from 'react'
import { TOKEN_KEY } from './auth'
import { API_BASE } from './useApi'

export type ThemeMode = 'LIGHT' | 'DARK' | 'AUTO'

export const THEME_MODES = ['LIGHT', 'AUTO', 'DARK'] as const satisfies readonly ThemeMode[]

const STORAGE_KEY = 'theme'

const darkQuery =
	typeof window !== 'undefined' && window.matchMedia
		? window.matchMedia('(prefers-color-scheme: dark)')
		: null

function readStored(): ThemeMode {
	try {
		const stored = localStorage.getItem(STORAGE_KEY)
		if (stored && (THEME_MODES as readonly string[]).includes(stored)) return stored as ThemeMode
	} catch {
		// fall back to AUTO
	}
	return 'AUTO'
}

let currentTheme: ThemeMode = readStored()
const listeners = new Set<() => void>()

function persistTheme(newTheme: ThemeMode): void {
	const token = localStorage.getItem(TOKEN_KEY)
	if (!token) return
	fetch(`${API_BASE}/users/profile`, {
		method: 'PUT',
		headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
		body: JSON.stringify({ preferences: { theme: newTheme } }),
	}).catch(() => {
	})
}

function updateTheme(): void {
	if (typeof document === 'undefined') return
	const dark = currentTheme === 'DARK' || (currentTheme === 'AUTO' && (darkQuery?.matches ?? false))
	document.documentElement.classList.toggle('dark', dark)
}

// while in AUTO, follow the OS theme as it changes
darkQuery?.addEventListener('change', () => {
	if (currentTheme === 'AUTO') updateTheme()
})

updateTheme()

export function getThemeMode(): ThemeMode {
	return currentTheme
}

export function systemPrefersDark(): boolean {
	return darkQuery?.matches ?? false
}

export function applyTheme(newTheme: ThemeMode): void {
	if (newTheme === currentTheme) return
	currentTheme = newTheme
	try {
		localStorage.setItem(STORAGE_KEY, newTheme)
	} catch {
		// ignore persistence failures — the choice still applies for this session
	}
	updateTheme()
	listeners.forEach((listener) => listener())
}

export function setThemeMode(newTheme: ThemeMode): void {
	if (newTheme === currentTheme) return
	applyTheme(newTheme)
	persistTheme(newTheme)
}

export function useThemeMode(): ThemeMode {
	return useSyncExternalStore(
		(callback) => {
			listeners.add(callback)
			return () => listeners.delete(callback)
		},
		getThemeMode,
		getThemeMode,
	)
}
