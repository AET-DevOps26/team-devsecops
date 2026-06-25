import { useLayoutEffect, useRef, useState } from 'react'
import type { ComponentProps } from 'react'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export function PasswordInput({
	className = '',
	...props
}: Omit<ComponentProps<'input'>, 'type'>) {
	const [visible, setVisible] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)

	useLayoutEffect(() => {
		// changing the input type re-selects all text in some browsers;
		// collapse the caret to the end so the toggle doesn't leave a selection
		const input = inputRef.current
		if (!input || document.activeElement !== input) return
		const end = input.value.length
		input.setSelectionRange(end, end)
		requestAnimationFrame(() => {
			if (inputRef.current === input && document.activeElement === input) {
				input.setSelectionRange(end, end)
			}
		})
	}, [visible])

	const toggleVisibility = () => setVisible((v) => !v)

	return (
		<div className="relative">
			<input
				ref={inputRef}
				type={visible ? 'text' : 'password'}
				className={`${className} pr-10`}
				{...props}
			/>
			<button
				type="button"
				onMouseDown={(e) => e.preventDefault()}
				onClick={toggleVisibility}
				className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 dark:text-neutral-500 cursor-pointer transition-transform duration-100 hover:scale-98"
				aria-label={visible ? 'Hide password' : 'Show password'}
			>
				{visible ? (
					<EyeSlashIcon className="h-5 w-5" />
				) : (
					<EyeIcon className="h-5 w-5" />
				)}
			</button>
		</div>
	)
}
