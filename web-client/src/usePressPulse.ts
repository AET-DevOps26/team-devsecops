import { useCallback, useRef } from 'react'

// briefly replay a button's press animation, e.g. when its form is submitted via Enter
export function usePressPulse<T extends HTMLElement = HTMLButtonElement>() {
	const elementRef = useRef<T>(null)
	const triggerPulseEffect = useCallback(() => {
		const element = elementRef.current
		if (!element) return
		element.classList.remove('animate-press')
		void element.offsetWidth // read the width (and discard it) so the browser notices the class change
		element.classList.add('animate-press')
	}, [])
	return [elementRef, triggerPulseEffect] as const
}
