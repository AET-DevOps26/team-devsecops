import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
// initialise i18next (English) so components using useTranslation render real text
import '../src/i18n'

afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
})
