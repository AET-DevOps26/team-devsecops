import { useCallback, useEffect, useRef, useState } from 'react'
import type { SaveStatus } from './components/SaveIndicator'

// How long to wait after the last keystroke before persisting.
const SAVE_DELAY_MS = 800
// How long the green check lingers (matches the fade-out animation) before
// the indicator clears.
const CHECKMARK_MS = 600

// Drives debounced autosave for a set of named fields that share a single
// payload (here: the whole taste-preferences object). Each field gets its own
// status so the spinner / checkmark can be rendered next to the input the user
// is actually editing, even though one request persists everything at once.
export function usePrefsAutosave<P>(options: {
  save: (payload: P) => Promise<void>
  onError: (error: unknown) => void
  delay?: number
  checkmarkMs?: number
}) {
  const { delay = SAVE_DELAY_MS, checkmarkMs = CHECKMARK_MS } = options
  // Keep the latest callbacks in refs so the timer-driven logic never closes
  // over a stale version.
  const saveRef = useRef(options.save)
  const onErrorRef = useRef(options.onError)

  const [statuses, setStatuses] = useState<Record<string, SaveStatus>>({})
  const statusesRef = useRef(statuses)
  const apply = useCallback((field: string, status: SaveStatus) => {
    const next = { ...statusesRef.current, [field]: status }
    statusesRef.current = next
    setStatuses(next)
  }, [])

  const payloadRef = useRef<P | null>(null)
  const versionRef = useRef<Record<string, number>>({})
  const savingVersionRef = useRef<Record<string, number>>({})
  const dirtyRef = useRef<Set<string>>(new Set())
  const inFlightRef = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fadeRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  // Reassigned every render; invoked indirectly via timers so it always sees
  // the freshest closure.
  const flushRef = useRef<() => void>(() => {})

  const scheduleFlush = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      flushRef.current()
    }, delay)
  }, [delay])

  const scheduleFade = useCallback(
    (field: string) => {
      if (fadeRef.current[field]) clearTimeout(fadeRef.current[field])
      fadeRef.current[field] = setTimeout(() => {
        // Only clear if it is still showing the check (no new edit arrived).
        if (statusesRef.current[field] === 'saved') apply(field, 'idle')
      }, checkmarkMs)
    },
    [apply, checkmarkMs],
  )

  const flush = () => {
    // A request is already running — it reschedules itself on settle.
    if (inFlightRef.current || dirtyRef.current.size === 0) return

    const fields = dirtyRef.current
    dirtyRef.current = new Set()
    fields.forEach((f) => {
      savingVersionRef.current[f] = versionRef.current[f] ?? 0
    })
    const payload = payloadRef.current as P

    inFlightRef.current = true
    saveRef.current(payload)
      .then(
        () => {
          fields.forEach((f) => {
            // Did the user keep editing this field while the request was in
            // flight? If so, keep spinning but flash the check in the middle.
            const settled = (versionRef.current[f] ?? 0) === savingVersionRef.current[f]
            if (settled) {
              apply(f, 'saved')
              scheduleFade(f)
            } else {
              apply(f, 'resaving')
            }
          })
        },
        (err: unknown) => {
          // Drop the spinner and surface the error; the value stays in the
          // input, so the next keystroke retries it (no auto-retry loop).
          fields.forEach((f) => apply(f, 'idle'))
          onErrorRef.current(err)
        },
      )
      .finally(() => {
        inFlightRef.current = false
        // Edits arrived while we were saving and the user has since stopped —
        // persist them.
        if (dirtyRef.current.size > 0) scheduleFlush()
      })
  }

  // Call on every edit of `field`, passing the full latest payload.
  const notifyEdit = useCallback(
    (field: string, payload: P) => {
      payloadRef.current = payload
      versionRef.current[field] = (versionRef.current[field] ?? 0) + 1
      dirtyRef.current.add(field)
      if (statusesRef.current[field] !== 'resaving') apply(field, 'saving')
      scheduleFlush()
    },
    [apply, scheduleFlush],
  )

  // Point the timer-driven closures at the latest render's values. Runs after
  // every commit; writing refs here (not during render) keeps react-hooks happy.
  useEffect(() => {
    saveRef.current = options.save
    onErrorRef.current = options.onError
    flushRef.current = flush
  })

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      Object.values(fadeRef.current).forEach(clearTimeout)
    },
    [],
  )

  return { statuses, notifyEdit }
}
