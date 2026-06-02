import { CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export type SaveStatus = 'idle' | 'saving' | 'resaving' | 'saved' | 'error'

const labels: Record<SaveStatus, string> = {
  idle: '',
  saving: 'Saving…',
  resaving: 'Saved, saving latest changes…',
  saved: 'Saved',
  error: 'Could not save',
}

export function SaveIndicator({
  status,
  className = '',
}: {
  status: SaveStatus
  className?: string
}) {
  return (
    <span
      className={`pointer-events-none flex h-5 w-5 items-center justify-center ${className}`}
      role="status"
      aria-label={labels[status]}
      data-status={status}
    >
      {(status === 'saving' || status === 'resaving') && (
        <span
          data-testid="save-spinner"
          className="absolute h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-orange-500"
        />
      )}
      {status === 'resaving' && (
        <CheckIcon className="relative h-3 w-3 text-green-600 stroke-[3]" />
      )}
      {status === 'saved' && (
        <CheckIcon
          data-testid="save-check"
          className="h-5 w-5 text-green-600 stroke-[3] animate-fade-out"
        />
      )}
      {status === 'error' && (
        <ExclamationTriangleIcon
          data-testid="save-error"
          className="h-5 w-5 text-amber-500 stroke-[2.5] animate-fade-in"
        />
      )}
    </span>
  )
}
