import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './locales/en'
import { de } from './locales/de'

export const SUPPORTED_LANGUAGES = ['en', 'de'] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]

const FALLBACK_LANGUAGE: Language = 'en'

const isSupported = (lang: string): lang is Language =>
	(SUPPORTED_LANGUAGES as readonly string[]).includes(lang)

function detectInitialLanguage(): Language {
	for (const tag of navigator.languages ?? [navigator.language]) {
		const base = tag.toLowerCase().split('-')[0]
		if (isSupported(base)) return base
	}
	return FALLBACK_LANGUAGE
}

i18n.use(initReactI18next).init({
	resources: { en, de },
	lng: detectInitialLanguage(),
	fallbackLng: FALLBACK_LANGUAGE,
	supportedLngs: SUPPORTED_LANGUAGES,
	interpolation: { escapeValue: false }, // React already escapes
	returnNull: false,
})

export function applyUserLanguage(lang: string | undefined | null) {
	if (lang && isSupported(lang) && i18n.resolvedLanguage !== lang) {
		void i18n.changeLanguage(lang)
	}
}

export default i18n
