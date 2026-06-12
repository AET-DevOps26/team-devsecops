import 'i18next'
import type { EN } from './locales/en'

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: typeof EN
    returnNull: false
  }
}
