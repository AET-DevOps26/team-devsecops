import {useEffect, useState} from 'react'
import type {Dispatch, SetStateAction} from 'react'
import {Outlet, useLocation, useNavigate, useOutletContext} from 'react-router-dom'
import {useTranslation} from 'react-i18next'
import {ChevronRightIcon, PencilSquareIcon, XMarkIcon} from '@heroicons/react/24/outline'
import type {components} from '../api'
import {Button} from '../components/Button'
import {RecipeCard} from '../components/RecipeCard'
import {TagSelector} from '../components/TagSelector'
import {tagsById} from '../recipeFormat'
import {localizeTagLabel} from '../locales/recipeTagLabels'
import {usePressPulse} from '../usePressPulse'
import {errorMessage} from '../apiError'
import {SessionExpiredError, useApi} from '../useApi'
import {currentLanguage} from '../i18n'

// id is stored on the recipe once it is saved
type Recipe = components['schemas']['RecipeInput'] & { id?: number }
type RecipeRequest = components['schemas']['RecipeRequest']

export interface RecipeGenerationContext {
	prompt: string
	setPrompt: Dispatch<SetStateAction<string>>
	selectedTags: string[]
	setSelectedTags: Dispatch<SetStateAction<string[]>>
	recipes: Recipe[]
	setRecipes: Dispatch<SetStateAction<Recipe[]>>
	status: string | null
	loading: boolean
	generate: () => void
}

const VIEW_ORDER = {options: 0, results: 1, recipe: 2} as const

function viewName(pathname: string): keyof typeof VIEW_ORDER {
	if (pathname.startsWith('/generate/results')) return 'results'
	if (pathname.startsWith('/generate/recipe')) return 'recipe'
	return 'options'
}

export function GenerateFlow() {
	const {t} = useTranslation()
	const apiFetch = useApi()
	const navigate = useNavigate()
	const {pathname} = useLocation()

	const [prompt, setPrompt] = useState(() => sessionStorage.getItem('recipe_prompt') ?? '')
	const [selectedTags, setSelectedTags] = useState<string[]>(() => {
		const stored = sessionStorage.getItem('recipe_tags')
		return stored ? (JSON.parse(stored) as string[]) : []
	})
	// keep the last results so the list is restored when returning from a recipe page
	const [recipes, setRecipes] = useState<Recipe[]>(() => {
		const stored = sessionStorage.getItem('generated_recipes')
		return stored ? (JSON.parse(stored) as Recipe[]) : []
	})
	const [status, setStatus] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	// Confirm the session is still valid
	useEffect(() => {
		// on failure, this will automatically redirect to /login
		apiFetch('/users/profile')
	}, [apiFetch])

	useEffect(() => {
		sessionStorage.setItem('generated_recipes', JSON.stringify(recipes))
	}, [recipes])

	async function generate() {
		setLoading(true)
		setStatus(t('generate.generatingStatus'))
		setRecipes([])
		sessionStorage.setItem('recipe_prompt', prompt)
		sessionStorage.setItem('recipe_tags', JSON.stringify(selectedTags))
		navigate('/generate/results')
		try {
			const tagLabels = selectedTags.map((id) => tagsById.get(id)?.label).filter(Boolean)
			const fullPrompt = tagLabels.length > 0 ? `${prompt}\n\nPreferences: ${tagLabels.join(', ')}` : prompt
			const body: RecipeRequest = {prompt: fullPrompt, language: currentLanguage()}
			const response = await apiFetch('/ai/recipes', {
				method: 'POST',
				headers: {'content-type': 'application/json'},
				body: JSON.stringify(body),
			})
			if (!response.ok) throw new Error(await errorMessage(response))
			const data = (await response.json()) as Recipe[]
			setRecipes(data)
			setStatus(data.length === 0 ? t('generate.noRecipes') : null)
		} catch (e) {
			if (e instanceof SessionExpiredError) return
			setStatus(t('common.error', {message: e instanceof Error ? e.message : String(e)}))
		} finally {
			setLoading(false)
		}
	}

	const view = viewName(pathname)
	const [prevView, setPrevView] = useState(view)
	const [slideDirectionBack, setSlideDirectionBack] = useState(false)
	if (view !== prevView) {
		setSlideDirectionBack(VIEW_ORDER[view] < VIEW_ORDER[prevView])
		setPrevView(view)
	}

	const context: RecipeGenerationContext = {
		prompt, setPrompt, selectedTags, setSelectedTags, recipes, setRecipes, status, loading, generate,
	}

	return (
		<div
			key={view}
			className={`flex flex-col gap-4 ${slideDirectionBack ? 'animate-slide-from-left' : 'animate-slide-from-right'}`}
		>
			<Outlet context={context}/>
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
	} = useOutletContext<RecipeGenerationContext>()
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

			<div className="flex flex-col items-center gap-3">
				{/* Clear selection button */}
				<button
					type="button"
					className="flex items-center gap-1 text-sm text-gray-500 dark:text-neutral-400 cursor-pointer transition-transform duration-100 hover:scale-98 disabled:cursor-default disabled:opacity-40 disabled:hover:scale-100"
					onClick={() => {
						setPrompt('')
						setSelectedTags([])
					}}
					disabled={prompt.trim() === '' && selectedTags.length === 0}
				>
					<XMarkIcon className="h-4 w-4"/>
					{t('generate.clear')}
				</button>

				{/* Generate button */}
				<Button
					ref={generateBtnRef}
					type="button"
					onClick={generate}
					disabled={loading || (prompt.trim() === '' && selectedTags.length === 0)}
				>
					{loading ? t('generate.generating') : t('generate.generate')}
				</Button>
			</div>
		</>
	)
}

export function GenerateResultsPage() {
	const {t, i18n} = useTranslation()
	const navigate = useNavigate()
	const {recipes, status, setRecipes} = useOutletContext<RecipeGenerationContext>()

	// read from sessionStorage instead of context so unsaved edits are not shown the results header
	const lastPrompt = sessionStorage.getItem('recipe_prompt') ?? ''
	const lastTags = JSON.parse(sessionStorage.getItem('recipe_tags') ?? '[]') as string[]

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
					{lastPrompt.trim() !== '' && <p className="text-sm text-gray-700 dark:text-neutral-200 line-clamp-2">{lastPrompt}</p>}
					{lastTags.length > 0 && (
						<div className="flex flex-wrap gap-1.5">
							{lastTags.map((id) => (
								<span key={id}
								      className="rounded-full border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-0.5 text-xs text-gray-600 dark:text-neutral-300">
									{localizeTagLabel(id, tagsById.get(id)?.label ?? id, i18n.language)}
								</span>
							))}
						</div>
					)}
					{lastPrompt.trim() === '' && lastTags.length === 0 && (
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
