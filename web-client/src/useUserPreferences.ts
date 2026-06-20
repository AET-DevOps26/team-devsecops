import { useEffect } from 'react'
import type { components } from './api'
import { applyUserLanguage } from './i18n'
import { applyTheme, THEME_MODES } from './theme'
import { SessionExpiredError, useApi } from './useApi'

type UserProfile = components['schemas']['UserProfile']

export function useUserPreferences() {
	const apiFetch = useApi()
	useEffect(() => {
		let cancelled = false
		apiFetch('/users/profile')
			.then(async (res) => {
				if (!res.ok) return
				const userProfile = (await res.json()) as UserProfile
				if (cancelled) return
				applyUserLanguage(userProfile.preferences?.language)
				const theme = userProfile.preferences?.theme
				if (theme && THEME_MODES.includes(theme)) applyTheme(theme)
			})
			.catch((e) => {
				if (e instanceof SessionExpiredError) return
				// a failed lookup shouldn't break the app (except for ProfilePage where this is explicitly handled)
			})

		return () => {
			cancelled = true
		}
	}, [apiFetch])
}
