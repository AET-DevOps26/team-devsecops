import { Outlet, useLocation } from 'react-router-dom'
import { Nav } from './Nav'

const titles: Record<string, string> = {
  'generate': 'Cooking Assistant',
  'library': 'Library',
  'profile': 'Profile',
}

export function AppLayout() {
  const { pathname } = useLocation()
  const section = pathname.split('/')[1]
  const title = titles[section] ?? 'Cooking Assistant'
  const bold = title === 'Cooking Assistant'

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
