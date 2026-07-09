import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Nav } from './Nav'
import { ThemeIconToggle } from './ThemeToggle'
import { useUserPreferences } from '../useUserPreferences'

const titleKeys = {
	generate: 'layout.generate',
	library: 'layout.library',
	profile: 'layout.profile',
} as const

export function AppLayout() {
	const { t } = useTranslation()
	const { pathname } = useLocation()
	useUserPreferences()
	const section = pathname.split('/')[1]
	const titleKey = titleKeys[section as keyof typeof titleKeys] ?? 'layout.generate'
	// the recipe editor takes over the section title instead of showing a separate heading
	const isEditing = pathname.endsWith('/edit')
	const title = isEditing ? t('recipe.edit') : t(titleKey)
	// the generate/default section keeps the bold "Cooking Assistant" header
	const bold = !isEditing && titleKey === 'layout.generate'

	return (
		<div className="min-h-screen md:flex">
			<Nav />
			<div className="flex flex-1 flex-col">
				<header className="flex items-center justify-between gap-3 border-b border-gray-200 p-4 md:hidden dark:border-neutral-700">
					<span className={`text-xl ${bold ? 'font-bold' : ''}`}>{title}</span>
					<ThemeIconToggle className="-my-2 -mr-2" />
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
