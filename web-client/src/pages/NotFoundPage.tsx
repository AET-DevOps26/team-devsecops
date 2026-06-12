import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function NotFoundPage() {
	const { t } = useTranslation()
	return (
		<main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
			<h1 className="text-2xl font-bold">{t('notFound.title')}</h1>
			<Link to="/" className="text-orange-600 underline self-start">
				{t('notFound.goHome')}
			</Link>
		</main>
	)
}
