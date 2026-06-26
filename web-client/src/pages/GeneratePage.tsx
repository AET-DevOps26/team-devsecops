import {useEffect, useState} from 'react'
import {Outlet, useLocation, useNavigate} from 'react-router-dom'
import {useTranslation} from 'react-i18next'
import {ChevronRightIcon, PencilSquareIcon} from '@heroicons/react/24/outline'
import {Button} from '../components/Button'
import {RecipeCard} from '../components/RecipeCard'
import {TagSelector} from '../components/TagSelector'
import {tagsById} from '../recipeFormat'
import {localizeTagLabel} from '../locales/recipeTagLabels'
import {usePressPulse} from '../usePressPulse'
import {useApi} from '../useApi'
import {useRecipeGeneration} from '../recipeGeneration'

const VIEW_ORDER = {options: 0, results: 1, recipe: 2} as const

function viewName(pathname: string): keyof typeof VIEW_ORDER {
	if (pathname.startsWith('/generate/results')) return 'results'
	if (pathname.startsWith('/generate/recipe')) return 'recipe'
	return 'options'
}

export function GenerateFlow() {
	const apiFetch = useApi()
	const {pathname} = useLocation()

	// Confirm the session is still valid
	useEffect(() => {
		// on failure, this will automatically redirect to /login
		apiFetch('/users/profile')
	}, [apiFetch])

	const view = viewName(pathname)
	const [prevView, setPrevView] = useState(view)
	const [slideDirectionBack, setSlideDirectionBack] = useState(false)
	if (view !== prevView) {
		setSlideDirectionBack(VIEW_ORDER[view] < VIEW_ORDER[prevView])
		setPrevView(view)
	}

	return (
		<div
			key={view}
			className={`flex flex-col gap-4 ${slideDirectionBack ? 'animate-slide-from-left' : 'animate-slide-from-right'}`}
		>
			<Outlet/>
		</div>
	)
}

export function GeneratePage() {
	const {t} = useTranslation()
	const navigate = useNavigate()
	const {
		prompt,
		setPrompt,
		selectedTags,
		setSelectedTags,
		recipes,
		loading,
		generate
	} = useRecipeGeneration()
	const [generateBtnRef, pulseGenerate] = usePressPulse<HTMLButtonElement>()

	return (
		<>
			<div className="flex items-center justify-between gap-3">
				<h2 className="text-lg font-bold">{t('generate.heading')}</h2>
				{recipes.length > 0 && (
					<button
						type="button"
						className="flex shrink-0 items-center gap-1 text-sm text-gray-500 dark:text-neutral-400 cursor-pointer transition-transform duration-100 hover:scale-98"
						onClick={() => navigate('/generate/results')}
					>
						{t('generate.viewRecipes')}
						<ChevronRightIcon className="h-4 w-4"/>
					</button>
				)}
			</div>
			<textarea
				className="w-full min-h-32 border border-gray-300 dark:border-neutral-600 rounded p-3"
				placeholder={t('generate.placeholder')}
				value={prompt}
				onChange={(e) => setPrompt(e.target.value)}
				onFocus={(e) => e.target.select()}
				onKeyDown={(e) => {
					if (e.key === 'Enter' && !e.shiftKey) {
						// on Enter: directly submit instead of adding a new line
						e.preventDefault()
						if (!loading && (prompt.trim() !== '' || selectedTags.length > 0)) {
							pulseGenerate()
							generate()
						}
					}
				}}
			/>

			<TagSelector selectedTags={selectedTags} onChange={setSelectedTags}/>

			<Button
				ref={generateBtnRef}
				type="button"
				className="self-center"
				onClick={generate}
				disabled={loading || (prompt.trim() === '' && selectedTags.length === 0)}
			>
				{loading ? t('generate.generating') : t('generate.generate')}
			</Button>
		</>
	)
}

export function GenerateResultsPage() {
	const {t, i18n} = useTranslation()
	const navigate = useNavigate()
	const {prompt, selectedTags, recipes, status, setRecipes} = useRecipeGeneration()

	function handleSavedIdChange(index: number, newId: number | undefined) {
		setRecipes((prev) => prev.map((prevRecipe, prevIndex) => (prevIndex === index ? {
			...prevRecipe,
			id: newId
		} : prevRecipe)))
	}

	return (
		<>
			<div className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 p-3">
				<div className="flex min-w-0 flex-col gap-2">
					{prompt.trim() !== '' && <p className="text-sm text-gray-700 dark:text-neutral-200 line-clamp-2">{prompt}</p>}
					{selectedTags.length > 0 && (
						<div className="flex flex-wrap gap-1.5">
							{selectedTags.map((id) => (
								<span key={id}
								      className="rounded-full border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-0.5 text-xs text-gray-600 dark:text-neutral-300">
									{localizeTagLabel(id, tagsById.get(id)?.label ?? id, i18n.language)}
								</span>
							))}
						</div>
					)}
					{prompt.trim() === '' && selectedTags.length === 0 && (
						<p className="text-sm text-gray-400 dark:text-neutral-500">{t('generate.noOptions')}</p>
					)}
				</div>
				<button
					type="button"
					className="flex shrink-0 items-center gap-1 self-start text-sm text-gray-500 dark:text-neutral-400 cursor-pointer transition-transform duration-100 hover:scale-98"
					onClick={() => navigate('/generate')}
				>
					<PencilSquareIcon className="h-4 w-4"/>
					{t('generate.edit')}
				</button>
			</div>

			{status && <p className="text-gray-600 dark:text-neutral-300">{status}</p>}

			{recipes.map((recipe, index) => (
				<RecipeCard
					key={index}
					recipe={recipe}
					recipeId={recipe.id}
					onSavedIdChange={(newId) => handleSavedIdChange(index, newId)}
					onOpen={() => navigate('/generate/recipe', {state: {index}})}
				/>
			))}
		</>
	)
}
