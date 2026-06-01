import { CheckIcon } from '@heroicons/react/24/outline'

export type SaveStatus = 'idle' | 'saving' | 'resaving' | 'saved'

const labels: Record<SaveStatus, string> = {
  idle: '',
  saving: 'Saving…',
  resaving: 'Saved, saving latest changes…',
  saved: 'Saved',
}

// Spinner / check overlay shown beside an autosaved field.
//  - saving:   spinner only (typing or request in flight)
//  - resaving: spinner with a check in its centre (a save landed but newer
//              edits are still being persisted)
//  - saved:    green check that fades out once everything is persisted
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
    </span>
  )
}
