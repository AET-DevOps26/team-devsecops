import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Nav } from './Nav'
import { useUserLanguage } from '../useUserLanguage'

const titleKeys = {
  generate: 'layout.generate',
  library: 'layout.library',
  profile: 'layout.profile',
} as const

export function AppLayout() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  useUserLanguage()
  const section = pathname.split('/')[1]
  const titleKey = titleKeys[section as keyof typeof titleKeys] ?? 'layout.generate'
  const title = t(titleKey)
  // the generate/default section keeps the bold "Cooking Assistant" header
  const bold = titleKey === 'layout.generate'

  return (
    <div className="min-h-screen md:flex">
      <Nav />
      <div className="flex flex-1 flex-col">
        <header className={`border-b border-gray-200 p-4 text-xl md:hidden ${bold ? 'font-bold' : ''}`}>
          {title}
        </header>
        <main className={`mx-auto w-full p-6 pb-24 md:pb-6 ${pathname === '/library' ? 'max-w-6xl' : 'max-w-2xl'}`}>
          <div key={section} className="flex flex-col gap-4 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
