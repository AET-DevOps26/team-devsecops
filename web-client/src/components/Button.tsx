import type { ComponentProps } from 'react'

export function Button({ className = '', ...props }: ComponentProps<'button'>) {
  return (
    <button
      className={`px-4 py-2 bg-orange-500 text-white rounded disabled:opacity-50 ${className}`}
      {...props}
    />
  )
}
