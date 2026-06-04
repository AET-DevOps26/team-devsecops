import { useCallback, useEffect, useRef, useState } from 'react'
import type { SaveStatus } from './components/SaveIndicator'

// How long to wait after the last keystroke before persisting.
const SAVE_DELAY_MS = 400
// How long a request may run before we bother showing the spinner — fast saves
// finish within this window
const SPINNER_DELAY_MS = 300
// How long the green checkmark lingers before the indicator clears.
const CHECKMARK_MS = 1500

export function usePrefsAutosave<P>(options: {
  save: (payload: P, keepalive?: boolean) => Promise<void>
  onError: (error: unknown) => void
  delay?: number
  spinnerDelay?: number
  checkmarkMs?: number
}) {
  const {
    delay = SAVE_DELAY_MS,
    spinnerDelay = SPINNER_DELAY_MS,
    checkmarkMs = CHECKMARK_MS,
  } = options
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
  const spinnerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fadeRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
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

    if (spinnerTimerRef.current) clearTimeout(spinnerTimerRef.current)
    spinnerTimerRef.current = setTimeout(() => {
      fields.forEach((f) => {
        if (statusesRef.current[f] !== 'resaving') apply(f, 'saving')
      })
    }, spinnerDelay)

    const payload = payloadRef.current as P

    inFlightRef.current = true
    saveRef.current(payload)
      .then(
        () => {
          if (spinnerTimerRef.current) clearTimeout(spinnerTimerRef.current)
          fields.forEach((f) => {
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
          if (spinnerTimerRef.current) clearTimeout(spinnerTimerRef.current)
          // Surface a warning on the affected fields; the value stays in the
          // input, so the next keystroke retries it (no auto-retry loop).
          fields.forEach((f) => apply(f, 'error'))
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

  const savePendingEditsNow = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    if (inFlightRef.current || dirtyRef.current.size === 0) return
    dirtyRef.current = new Set()
    saveRef.current(payloadRef.current as P, true).catch((err) => onErrorRef.current(err))
  }, [])

  // Call on every edit of `field`, passing the full latest payload.
  const notifyEdit = useCallback(
    (field: string, payload: P) => {
      payloadRef.current = payload
      versionRef.current[field] = (versionRef.current[field] ?? 0) + 1
      dirtyRef.current.add(field)
      // Resuming typing clears a finished check / warning right away; no spinner
      // is shown until the request is actually sent.
      const current = statusesRef.current[field]
      if (current === 'saved' || current === 'error') {
        if (fadeRef.current[field]) clearTimeout(fadeRef.current[field])
        apply(field, 'idle')
      }
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

	// Save pending edits when the user navigates
  useEffect(() => {
    const onPageHide = () => savePendingEditsNow()
    window.addEventListener('pagehide', onPageHide)
    return () => {
      window.removeEventListener('pagehide', onPageHide)
      savePendingEditsNow()
    }
  }, [savePendingEditsNow])

  useEffect(
    () => () => {
      if (spinnerTimerRef.current) clearTimeout(spinnerTimerRef.current)
      Object.values(fadeRef.current).forEach(clearTimeout)
    },
    [],
  )

  return { statuses, notifyEdit }
}
