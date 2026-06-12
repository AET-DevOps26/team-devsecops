import 'i18next'
import type { en } from './locales/en'

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: typeof en
    returnNull: false
  }
}
