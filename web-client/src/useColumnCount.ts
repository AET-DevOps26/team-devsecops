import {useSyncExternalStore} from 'react'

// same breakpoints as for Tailwind
const LG = '(min-width: 64rem)'
const MD = '(min-width: 48rem)'

function subscribe(onChange: () => void): () => void {
	if (!window.matchMedia) return () => {}
	const queries = [window.matchMedia(LG), window.matchMedia(MD)]
	queries.forEach((query) => query.addEventListener('change', onChange))
	return () => queries.forEach((query) => query.removeEventListener('change', onChange))
}

function getColumnCount(): number {
	if (!window.matchMedia) return 1
	if (window.matchMedia(LG).matches) return 3
	if (window.matchMedia(MD).matches) return 2
	return 1
}

export function useColumnCount(): number {
	return useSyncExternalStore(subscribe, getColumnCount, () => 1)
}
