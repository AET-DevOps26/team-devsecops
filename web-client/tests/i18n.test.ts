import { afterEach, describe, expect, it, vi } from 'vitest'
import { detectInitialLanguage } from '../src/i18n'

// detectInitialLanguage reads navigator.languages at call time, so stubbing the
// global navigator lets us simulate different browser language settings.
function withBrowserLanguages(languages: string[]) {
	vi.stubGlobal('navigator', { ...navigator, languages, language: languages[0] })
}

describe('detectInitialLanguage', () => {
	afterEach(() => vi.unstubAllGlobals())

	it('detects a non-English browser language', () => {
		withBrowserLanguages(['de-DE', 'en-US'])
		expect(detectInitialLanguage()).toBe('DE')
	})

	it('falls back to English when no browser language is supported', () => {
		withBrowserLanguages(['fr-FR', 'es-ES'])
		expect(detectInitialLanguage()).toBe('EN')
	})
})
