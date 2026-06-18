import { useSyncExternalStore } from 'react'

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

let currentMode: ThemeMode = readStored()
const listeners = new Set<() => void>()

function updateTheme(): void {
	if (typeof document === 'undefined') return
	const dark = currentMode === 'DARK' || (currentMode === 'AUTO' && (darkQuery?.matches ?? false))
	document.documentElement.classList.toggle('dark', dark)
}

// while in AUTO, follow the OS theme as it changes
darkQuery?.addEventListener('change', () => {
	if (currentMode === 'AUTO') updateTheme()
})

updateTheme()

export function getThemeMode(): ThemeMode {
	return currentMode
}

export function systemPrefersDark(): boolean {
	return darkQuery?.matches ?? false
}

export function setThemeMode(mode: ThemeMode): void {
	if (mode === currentMode) return
	currentMode = mode
	try {
		localStorage.setItem(STORAGE_KEY, mode)
	} catch {
		// ignore persistence failures — the choice still applies for this session
	}
	updateTheme()
	listeners.forEach((listener) => listener())
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
