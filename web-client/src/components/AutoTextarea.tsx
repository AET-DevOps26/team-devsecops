import { useLayoutEffect, useRef } from 'react'
import type { ComponentProps } from 'react'

// A textarea that starts at one line and grows to fit its content.
export function AutoTextarea({ value, className, ...props }: ComponentProps<'textarea'>) {
	const ref = useRef<HTMLTextAreaElement>(null)
	useLayoutEffect(() => {
		const el = ref.current
		if (!el) return
		el.style.height = 'auto'
		el.style.height = `${el.scrollHeight}px`
	}, [value])
	return (
		<textarea
			ref={ref}
			rows={1}
			value={value}
			className={`resize-none overflow-hidden ${className ?? ''}`}
			{...props}
		/>
	)
}
