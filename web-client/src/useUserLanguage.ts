import { useEffect } from 'react'
import type { components } from './api'
import { applyUserLanguage } from './i18n'
import { SessionExpiredError, useApi } from './useApi'

type UserProfile = components['schemas']['UserProfile']

// Fetch the signed-in user's saved language once and apply it app-wide. This
// takes precedence over the browser-based language picked at startup.
export function useUserLanguage() {
  const apiFetch = useApi()
  useEffect(() => {
    let cancelled = false
    apiFetch('/users/profile')
      .then(async (res) => {
        if (!res.ok) return
        const data = (await res.json()) as UserProfile
        if (!cancelled) applyUserLanguage(data.preferences?.language)
      })
      .catch((e) => {
        if (e instanceof SessionExpiredError) return
        // a failed language lookup shouldn't break the app — keep the default
      })
    return () => {
      cancelled = true
    }
  }, [apiFetch])
}
