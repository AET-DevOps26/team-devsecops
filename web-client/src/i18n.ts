import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { components } from './api'
import { EN } from './locales/en'
import { DE } from './locales/de'
import { HU } from './locales/hu'

export type Language = NonNullable<components['schemas']['UserPreferences']['language']>

export const SUPPORTED_LANGUAGES = ['EN', 'DE', 'HU'] as const satisfies readonly Language[]

const FALLBACK_LANGUAGE: Language = 'EN'

const isSupported = (lang: string): lang is Language =>
	(SUPPORTED_LANGUAGES as readonly string[]).includes(lang)

export function detectInitialLanguage(): Language {
	for (const tag of navigator.languages ?? [navigator.language]) {
		const base = tag.toUpperCase().split('-')[0]
		if (isSupported(base)) return base
	}
	return FALLBACK_LANGUAGE
}

i18n.use(initReactI18next).init({
	resources: { EN, DE, HU },
	lng: detectInitialLanguage(),
	fallbackLng: FALLBACK_LANGUAGE,
	supportedLngs: SUPPORTED_LANGUAGES,
	interpolation: { escapeValue: false }, // React already escapes
	returnNull: false,
})

export function currentLanguage(): Language {
	const lang = i18n.resolvedLanguage
	return lang && isSupported(lang) ? lang : FALLBACK_LANGUAGE
}

export function applyUserLanguage(lang: string | undefined | null) {
	if (lang && isSupported(lang) && i18n.resolvedLanguage !== lang) {
		void i18n.changeLanguage(lang)
	}
}

export default i18n
