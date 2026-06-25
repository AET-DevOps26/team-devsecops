import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
	ArrowPathIcon,
	ArrowRightIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	MinusIcon,
	PlusIcon,
} from '@heroicons/react/24/outline'
import Markdown from 'react-markdown'
import { Link, Navigate, useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { components } from '../api'
import type { RecipeGenerationContext } from './GeneratePage'
import { RecipeSaveButton } from '../components/RecipeSaveButton.tsx'
import { formatQuantity } from '../recipeFormat'
import { usePressPulse } from '../usePressPulse'
import { errorMessage } from '../apiError'
import { SessionExpiredError, useApi } from '../useApi'

type Recipe = components['schemas']['RecipeInput'] & { id?: number }
type HelpRequest = components['schemas']['HelpRequest']
type HelpResponse = components['schemas']['HelpResponse']
type HelpEntry = { question: string; answer: string }

type Pagination = { index: number; count: number; onNavigate: (index: number) => void }

function toggleSetItem(set: Set<number>, item: number): Set<number> {
	const next = new Set(set)
	if (next.has(item)) next.delete(item)
	else next.add(item)
	return next
}

export function RecipePage() {
	const { pathname } = useLocation()
	return pathname.startsWith('/library/') ? <LibraryRecipePage key={pathname} /> : <GeneratedRecipePage />
}

// Generated recipes are shared with the GenerateFlow layout (which persists them to sessionStorage)
// and are paged through by list index in router state.
function GeneratedRecipePage() {
	const location = useLocation()
	const navigate = useNavigate()
	const index = (location.state as { index?: number } | null)?.index ?? 0
	const { recipes, setRecipes } = useOutletContext<RecipeGenerationContext>()
	const [helpAnswers, setHelpAnswers] = useState<Record<number, HelpEntry[]>>({})
	const recipe = recipes[index]

	function handleSavedIdChange(newId: number | undefined) {
		setRecipes((prev) =>
			prev.map((prevRecipe, prevIndex) => (prevIndex === index ? { ...prevRecipe, id: newId } : prevRecipe)),
		)
	}

	if (!recipe) return <Navigate to="/generate" replace />

	return (
		<RecipeView
			key={index}
			recipe={recipe}
			parentPath="/generate/results"
			onSavedIdChange={handleSavedIdChange}
			answers={helpAnswers[index] ?? []}
			onAnswer={(entry) => setHelpAnswers((m) => ({ ...m, [index]: [entry, ...(m[index] ?? [])] }))}
			pagination={{
				index,
				count: recipes.length,
				onNavigate: (i) => navigate('/generate/recipe', { state: { index: i }, replace: true }),
			}}
		/>
	)
}

// Saved recipes are fetched by id on every view, so the API is always the source of truth.
function LibraryRecipePage() {
	const { t } = useTranslation()
	const params = useParams()
	const location = useLocation()
	const navigate = useNavigate()
	const recipeId = Number(params.recipeId)
	const recipeIdsInLibrary = (location.state as { ids?: number[] } | null)?.ids
	const apiFetch = useApi()
	const [recipe, setRecipe] = useState<Recipe | null>(null)
	const [phase, setPhase] = useState<'loading' | 'ready' | 'notfound' | 'error'>('loading')
	const [error, setError] = useState<string | null>(null)
	const [answers, setAnswers] = useState<HelpEntry[]>([])

	useEffect(() => {
		let cancelled = false
		async function load() {
			try {
				const res = await apiFetch(`/recipes/${recipeId}`)
				// 401/403 are handled by apiFetch (redirects to /login)
				if (res.status === 404) {
					if (!cancelled) setPhase('notfound')
					return
				}
				if (!res.ok) throw new Error(await errorMessage(res))
				const data = (await res.json()) as Recipe
				if (cancelled) return
				setRecipe(data)
				setPhase('ready')
			} catch (e) {
				if (cancelled || e instanceof SessionExpiredError) return
				setError(t('common.error', { message: e instanceof Error ? e.message : String(e) }))
				setPhase('error')
			}
		}
		load()
		return () => {
			cancelled = true
		}
	}, [apiFetch, recipeId, t])

	if (phase === 'loading') return <p className="text-gray-500 dark:text-neutral-400">{t('common.loading')}</p>
	if (phase === 'error') return <p className="text-red-600 dark:text-red-400">{error}</p>
	if (phase === 'notfound' || !recipe) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
				<h2 className="text-lg font-bold">{t('recipe.notFoundTitle')}</h2>
				<p className="max-w-xs text-gray-500 dark:text-neutral-400">{t('recipe.notFoundBody')}</p>
				<Link to="/library" className="text-orange-600 dark:text-orange-400 hover:underline">
					{t('recipe.backToLibrary')}
				</Link>
			</div>
		)
	}

	const idx = recipeIdsInLibrary ? recipeIdsInLibrary.indexOf(recipeId) : -1
	const pagination =
    recipeIdsInLibrary && recipeIdsInLibrary.length > 1 && idx >= 0
    	? { index: idx, count: recipeIdsInLibrary.length, onNavigate: (i: number) => navigate(`/library/recipe/${recipeIdsInLibrary[i]}`, { state: { ids: recipeIdsInLibrary } }) }
    	: undefined

	return (
		<RecipeView
			recipe={recipe}
			parentPath="/library"
			answers={answers}
			onAnswer={(entry) => setAnswers((a) => [entry, ...a])}
			pagination={pagination}
		/>
	)
}

function RecipeView({
	recipe,
	parentPath,
	onSavedIdChange,
	answers,
	onAnswer,
	pagination,
}: {
  recipe: Recipe
  parentPath: string
  onSavedIdChange?: (id: number | undefined) => void
  answers: HelpEntry[]
  onAnswer: (entry: HelpEntry) => void
  pagination?: Pagination
}) {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const apiFetch = useApi()

	const [portions, setPortions] = useState(recipe.portions)
	const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set())
	const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set())

	const [helpPrompt, setHelpPrompt] = useState('')
	const [pendingQuestion, setPendingQuestion] = useState('')
	const [helpError, setHelpError] = useState<string | null>(null)
	const [helpLoading, setHelpLoading] = useState(false)

	const [sendBtnRef, pulseSend] = usePressPulse<HTMLButtonElement>()

	// grow the help input to fit its content
	const helpInputRef = useRef<HTMLTextAreaElement>(null)
	useLayoutEffect(() => {
		const el = helpInputRef.current
		if (!el) return
		el.style.height = 'auto'
		el.style.height = `${el.scrollHeight}px`
	}, [helpPrompt])

	const scale = recipe.portions ? portions / recipe.portions : 1
	const pages = pagination && pagination.count > 1 ? pagination : null

	const scaledIngredients = recipe.ingredients.map((ing) => ({
		...ing,
		quantity: ing.quantity != null ? ing.quantity * scale : ing.quantity,
	}))
	const scaledNutrients = recipe.nutrients && {
		calories: recipe.nutrients.calories != null ? Math.round(recipe.nutrients.calories * scale) : recipe.nutrients.calories,
		protein: recipe.nutrients.protein != null ? Math.round(recipe.nutrients.protein * scale) : recipe.nutrients.protein,
		fat: recipe.nutrients.fat != null ? Math.round(recipe.nutrients.fat * scale) : recipe.nutrients.fat,
		carbs: recipe.nutrients.carbs != null ? Math.round(recipe.nutrients.carbs * scale) : recipe.nutrients.carbs,
	}

	async function handleGetHelp() {
		const question = helpPrompt.trim()
		if (question === '') return
		setPendingQuestion(question)
		setHelpLoading(true)
		setHelpError(null)
		try {
			const body: HelpRequest = {
				recipe: {
					title: recipe.title,
					ingredients: scaledIngredients,
					instructions: recipe.instructions,
					nutrients: scaledNutrients,
					portions,
				},
				prompt: question,
			}
			const response = await apiFetch('/ai/help', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(body),
			})
			if (!response.ok) throw new Error(await errorMessage(response))
			const data = (await response.json()) as HelpResponse
			onAnswer({ question, answer: data.response ?? t('recipe.noResponse') })
			setHelpPrompt('')
		} catch (e) {
			if (e instanceof SessionExpiredError) return
			setHelpError(t('common.error', { message: e instanceof Error ? e.message : String(e) }))
		} finally {
			setHelpLoading(false)
		}
	}

	return (
		<>
			{/* Back to the section list */}
			<button
				type="button"
				className="flex items-center gap-1 self-start text-gray-500 dark:text-neutral-400 cursor-pointer transition-transform duration-100 hover:scale-98"
				onClick={() => navigate(parentPath)}
			>
				<ChevronLeftIcon className="h-5 w-5" />
				{t('common.back')}
			</button>

			<article className="relative w-full rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 shadow-sm flex flex-col gap-4">

				{/* previous / next recipe (desktop) */}
				{pages && (
					<>
						<button
							type="button"
							className="hidden lg:flex absolute top-1/2 -left-16 -translate-y-1/2 flex-col items-center gap-1 cursor-pointer text-gray-500 dark:text-neutral-400 transition-transform duration-100 hover:scale-95 disabled:opacity-40 disabled:hover:scale-100"
							onClick={() => pages.onNavigate(pages.index - 1)}
							disabled={pages.index <= 0}
						>
							<span className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 shadow-sm">
								<ChevronLeftIcon className="h-5 w-5" />
							</span>
							<span className="text-xs">{t('recipe.previous')}</span>
						</button>
						<button
							type="button"
							className="hidden lg:flex absolute top-1/2 -right-16 -translate-y-1/2 flex-col items-center gap-1 cursor-pointer text-gray-500 dark:text-neutral-400 transition-transform duration-100 hover:scale-95 disabled:opacity-40 disabled:hover:scale-100"
							onClick={() => pages.onNavigate(pages.index + 1)}
							disabled={pages.index >= pages.count - 1}
						>
							<span className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 shadow-sm">
								<ChevronRightIcon className="h-5 w-5" />
							</span>
							<span className="text-xs">{t('recipe.next')}</span>
						</button>
					</>
				)}

				{/* Title & portion selector */}
				<header className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-1">
						<h2 className="text-lg font-bold">{recipe.title}</h2>
						<RecipeSaveButton
							recipe={recipe}
							recipeId={recipe.id}
							onSavedIdChange={onSavedIdChange}
							onDeleted={() => navigate(parentPath)}
						/>
					</div>
					<div className="flex items-center gap-2">
						<button
							type="button"
							className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 dark:border-neutral-600 cursor-pointer text-gray-600 dark:text-neutral-300 transition-transform duration-100 hover:scale-95 disabled:opacity-40"
							onClick={() => setPortions((p) => Math.max(0.5, p - (p <= 5 ? 0.5 : 1)))}
							disabled={portions <= 0.5}
							aria-label={t('recipe.decreasePortions')}
						>
							<MinusIcon className="h-4 w-4 stroke-2" />
						</button>
						<span className="w-20 text-center text-sm text-gray-600 dark:text-neutral-300">
							{formatQuantity(portions)} {portions <= 1 ? t('common.portion') : t('common.portions')}
						</span>
						<button
							type="button"
							className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 dark:border-neutral-600 cursor-pointer text-gray-600 dark:text-neutral-300 transition-transform duration-100 hover:scale-95"
							onClick={() => setPortions((p) => p + (p < 5 ? 0.5 : 1))}
							aria-label={t('recipe.increasePortions')}
						>
							<PlusIcon className="h-4 w-4 stroke-2" />
						</button>
					</div>
				</header>

				{/* Ingredients */}
				<div>
					<h3 className="font-medium">{t('recipe.ingredients')}</h3>
					<ul className="flex flex-col gap-1">
						{scaledIngredients.map((ing, j) => {
							const checked = checkedIngredients.has(j)
							return (
								<li key={j}>
									<label className="flex items-baseline gap-2 cursor-pointer">
										<input
											type="checkbox"
											checked={checked}
											onChange={() => setCheckedIngredients((s) => toggleSetItem(s, j))}
										/>
										<span className={checked ? 'line-through text-gray-400 dark:text-neutral-500' : ''}>
											{[
												ing.quantity != null ? formatQuantity(ing.quantity) : null,
												ing.unit,
												ing.name,
											]
												.filter(Boolean)
												.join(' ')}
										</span>
									</label>
								</li>
							)
						})}
					</ul>
				</div>

				{/* Instructions */}
				<div>
					<h3 className="font-medium">{t('recipe.instructions')}</h3>
					<ol className="flex flex-col gap-2">
						{recipe.instructions.map((step, j) => {
							const checked = checkedSteps.has(j)
							return (
								<li key={j}>
									<button
										type="button"
										onClick={() => setCheckedSteps((s) => toggleSetItem(s, j))}
										className="flex items-baseline gap-2 text-left cursor-pointer"
									>
										<span className="text-sm font-medium text-gray-400 dark:text-neutral-500">{j + 1}.</span>
										<span className={checked ? 'line-through text-gray-400 dark:text-neutral-500' : ''}>{step}</span>
									</button>
								</li>
							)
						})}
					</ol>
				</div>

				{/* Nutrients */}
				{scaledNutrients && (
					<div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-neutral-300">
						{scaledNutrients.calories != null && <span>{t('common.kcal', { value: scaledNutrients.calories })}</span>}
						{scaledNutrients.protein != null && <span>{t('common.protein', { value: scaledNutrients.protein })}</span>}
						{scaledNutrients.fat != null && <span>{t('common.fat', { value: scaledNutrients.fat })}</span>}
						{scaledNutrients.carbs != null && <span>{t('common.carbs', { value: scaledNutrients.carbs })}</span>}
					</div>
				)}
			</article>

			{/* Get help */}
			<div className="w-full flex flex-col gap-3 py-4">
				<h3 className="font-medium">{t('recipe.getHelp')}</h3>
				<div className="relative">
					<textarea
						ref={helpInputRef}
						rows={1}
						className="w-full min-h-20 resize-none overflow-hidden border border-gray-300 dark:border-neutral-600 rounded-lg p-3 pr-14"
						placeholder={t('recipe.helpPlaceholder')}
						value={helpPrompt}
						onChange={(e) => setHelpPrompt(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && !e.shiftKey) {
								e.preventDefault()
								if (!helpLoading && helpPrompt.trim() !== '') {
									pulseSend()
									handleGetHelp()
								}
							}
						}}
					/>
					<button
						ref={sendBtnRef}
						type="button"
						className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 dark:bg-orange-700 text-white cursor-pointer transition-transform duration-100 hover:scale-95 disabled:opacity-50 disabled:hover:scale-100"
						onClick={handleGetHelp}
						disabled={helpLoading || helpPrompt.trim() === ''}
						aria-label={t('recipe.getHelp')}
					>
						{helpLoading ? (
							<ArrowPathIcon className="h-5 w-5 animate-spin [animation-duration:1.5s]" />
						) : (
							<ArrowRightIcon className="h-5 w-5" />
						)}
					</button>
				</div>
				{helpError && <p className="text-red-600 dark:text-red-400">{helpError}</p>}
			</div>

			{/* Preview while loading */}
			{helpLoading && (
				<div className="w-full rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 shadow-sm flex flex-col gap-2">
					<p className="self-start rounded-lg bg-orange-50 dark:bg-orange-500/15 px-3 py-2 font-medium text-orange-900 dark:text-orange-200 first-letter:uppercase">
						{pendingQuestion}
					</p>
					<p className="animate-pulse text-gray-400 dark:text-neutral-500">{t('recipe.thinking')}</p>
				</div>
			)}

			{/* Previous help queries */}
			{answers.map((entry, i) => (
				<div
					key={i}
					className="w-full rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 shadow-sm flex flex-col gap-2"
				>
					<p className="self-start rounded-lg bg-orange-50 dark:bg-orange-500/15 px-3 py-2 font-medium text-orange-900 dark:text-orange-200 first-letter:uppercase">
						{entry.question}
					</p>
					<div className="prose prose-sm dark:prose-invert max-w-none">
						<Markdown>{entry.answer}</Markdown>
					</div>
				</div>
			))}

			{/* previous / next recipe (mobile) */}
			{pages && (
				<div className="pointer-events-none fixed inset-x-0 bottom-20 z-20 flex justify-center px-4 md:left-56 lg:hidden">
					<div className="pointer-events-auto flex items-center gap-3 rounded-full border border-gray-200 dark:border-neutral-700 bg-white/90 dark:bg-neutral-800/90 py-2 pl-2 pr-2 shadow-lg backdrop-blur">
						<button
							type="button"
							className="flex h-8 w-8 items-center justify-center cursor-pointer text-gray-600 dark:text-neutral-300 transition-transform duration-100 hover:scale-95 disabled:opacity-40 disabled:hover:scale-100"
							onClick={() => pages.onNavigate(pages.index - 1)}
							disabled={pages.index <= 0}
							aria-label={t('recipe.previousRecipe')}
						>
							<ChevronLeftIcon className="h-5 w-5" />
						</button>
						<span className="text-sm text-gray-500 dark:text-neutral-400 tabular-nums">
							{t('recipe.pageOf', { current: pages.index + 1, total: pages.count })}
						</span>
						<button
							type="button"
							className="flex h-8 w-8 items-center justify-center cursor-pointer text-gray-600 dark:text-neutral-300 transition-transform duration-100 hover:scale-95 disabled:opacity-40 disabled:hover:scale-100"
							onClick={() => pages.onNavigate(pages.index + 1)}
							disabled={pages.index >= pages.count - 1}
							aria-label={t('recipe.nextRecipe')}
						>
							<ChevronRightIcon className="h-5 w-5" />
						</button>
					</div>
				</div>
			)}

			{/* room to scroll the last card above the floating prev/next bar */}
			{pages && <div aria-hidden className="h-24 lg:hidden" />}
		</>
	)
}
