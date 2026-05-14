import { useLayoutEffect, useRef, useState } from 'react'
import type { ComponentProps } from 'react'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export function PasswordInput({
  className = '',
  ...props
}: Omit<ComponentProps<'input'>, 'type'>) {
  const [visible, setVisible] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const selectionRef = useRef<[number, number] | null>(null)


  useLayoutEffect(() => {
		// changing the input type re-selects all text in some browsers
		// to avoid: restore the caret/selection the user had before the toggle
    const input = inputRef.current
    if (input && selectionRef.current) {
      input.setSelectionRange(...selectionRef.current)
      selectionRef.current = null
    }
  }, [visible])

  const toggleVisibility = () => {
    const input = inputRef.current
    if (input) {
      selectionRef.current = [input.selectionStart ?? 0, input.selectionEnd ?? 0]
    }
    setVisible((v) => !v)
  }

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
        className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 cursor-pointer transition-transform duration-100 hover:scale-98"
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
