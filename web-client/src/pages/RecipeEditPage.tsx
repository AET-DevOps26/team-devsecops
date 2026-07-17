import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeftIcon, PlusIcon, SparklesIcon, TrashIcon } from '@heroicons/react/24/outline'
import { createPortal } from 'react-dom'
import { Link, Navigate, useBlocker, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { components } from '../api'
import { useRecipeGeneration } from '../recipeGeneration'
import { AutoTextarea } from '../components/AutoTextarea'
import { Button } from '../components/Button'
import { errorMessage } from '../apiError'
import { SessionExpiredError, useApi } from '../useApi'

type Recipe = components['schemas']['RecipeInput'] & { id?: number }
type RecipeInput = components['schemas']['RecipeInput']
type RecipeCreated = components['schemas']['RecipeCreated']
type RecipeNutrients = components['schemas']['RecipeNutrients']

// Editable mirror of a recipe: every field is a string so the inputs stay controlled
// while the user types (e.g. a half-entered number), and is parsed back on save.
type IngredientDraft = { quantity: string; unit: string; name: string }
type RecipeDraft = {
	title: string
	portions: string
	ingredients: IngredientDraft[]
	instructions: string[]
	nutrients: { calories: string; protein: string; fat: string; carbs: string }
}

const NUTRIENTS = [
	{ key: 'calories', labelKey: 'recipe.caloriesLabel', unit: 'kcal' },
	{ key: 'protein', labelKey: 'recipe.proteinLabel', unit: 'g' },
	{ key: 'fat', labelKey: 'recipe.fatLabel', unit: 'g' },
	{ key: 'carbs', labelKey: 'recipe.carbsLabel', unit: 'g' },
] as const

const numToStr = (n: number | null | undefined) => (n != null ? String(n) : '')

const isInvalidCount = (s: string) => !(Number.parseFloat(s) >= 0.5)
// Nutrients may legitimately be zero (a fat-free recipe), unlike portions and quantities.
const isInvalidAmount = (s: string) => !(Number.parseFloat(s) >= 0)
const isBlankIngredient = (ing: IngredientDraft) =>
	ing.name.trim() === '' && ing.unit.trim() === '' && ing.quantity.trim() === ''

function toDraft(recipe: Recipe): RecipeDraft {
	return {
		title: recipe.title,
		portions: numToStr(recipe.portions),
		ingredients: recipe.ingredients.map((ing) => ({
			quantity: numToStr(ing.quantity),
			unit: ing.unit ?? '',
			name: ing.name ?? '',
		})),
		instructions: [...recipe.instructions],
		nutrients: {
			calories: numToStr(recipe.nutrients?.calories),
			protein: numToStr(recipe.nutrients?.protein),
			fat: numToStr(recipe.nutrients?.fat),
			carbs: numToStr(recipe.nutrients?.carbs),
		},
	}
}

const toInt = (s: string) => Math.round(Number.parseFloat(s))

// Parse a validated draft into the recipe itself: drop fully-blank rows, coerce numbers.
// Nutrients are excluded — they are what the estimator derives from these fields.
function buildRecipe(draft: RecipeDraft): Omit<RecipeInput, 'nutrients'> {
	const ingredients = draft.ingredients
		.filter((ing) => !isBlankIngredient(ing))
		.map((ing) => ({
			quantity: Number.parseFloat(ing.quantity),
			unit: ing.unit.trim(),
			name: ing.name.trim(),
		}))
	const instructions = draft.instructions.map((step) => step.trim()).filter((step) => step !== '')
	return {
		title: draft.title.trim(),
		ingredients,
		instructions,
		portions: Number.parseFloat(draft.portions),
	}
}

function buildRecipeInput(draft: RecipeDraft): RecipeInput {
	return {
		...buildRecipe(draft),
		nutrients: {
			calories: toInt(draft.nutrients.calories),
			protein: toInt(draft.nutrients.protein),
			fat: toInt(draft.nutrients.fat),
			carbs: toInt(draft.nutrients.carbs),
		},
	}
}

export function RecipeEditPage() {
	const { pathname } = useLocation()
	return pathname.startsWith('/library/') ? <LibraryRecipeEditPage key={pathname} /> : <GeneratedRecipeEditPage />
}

// Editing an unsaved, generated recipe
function GeneratedRecipeEditPage() {
	const location = useLocation()
	const navigate = useNavigate()
	const index = (location.state as { index?: number } | null)?.index ?? 0
	const { recipes, setRecipes } = useRecipeGeneration()
	const recipe = recipes[index]

	if (!recipe) return <Navigate to="/generate" replace />

	const back = () => navigate('/generate/recipe', { state: { index }, replace: true })

	return (
		<RecipeEditor
			recipe={recipe}
			onCancel={back}
			onSaved={(updated) => {
				setRecipes((prev) => prev.map((prevRecipe, prevIndex) => (prevIndex === index ? updated : prevRecipe)))
				back()
			}}
		/>
	)
}

// Editing a saved recipe (fetched from the API)
function LibraryRecipeEditPage() {
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

	useEffect(() => {
		let cancelled = false
		async function load() {
			try {
				const res = await apiFetch(`/recipes/${recipeId}`)
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

	const back = () =>
		navigate(`/library/recipe/${recipeId}`, {
			state: recipeIdsInLibrary ? { ids: recipeIdsInLibrary } : undefined,
		})

	return <RecipeEditor recipe={recipe} onCancel={back} onSaved={back} />
}

const inputBase = 'rounded-md border bg-transparent px-2 py-1'
const neutralBorder = 'border-gray-300 dark:border-neutral-600'
const borderFor = (invalid: boolean) => (invalid ? 'border-red-500 dark:border-red-500' : neutralBorder)

const sectionCard =
	'rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 shadow-sm'

const columnWidth = (values: string[], capChars: number) =>
	`calc(${Math.min(capChars, Math.max(1, ...values.map((v) => v.length)))}ch + 1rem)`

function RecipeEditor({
	recipe,
	onCancel,
	onSaved,
}: {
  recipe: Recipe
  onCancel: () => void
  onSaved: (updated: Recipe) => void
}) {
	const { t } = useTranslation()
	const apiFetch = useApi()
	const [draft, setDraft] = useState<RecipeDraft>(() => toDraft(recipe))
	const [saving, setSaving] = useState(false)
	const [saveError, setSaveError] = useState<string | null>(null)
	const [askPersist, setAskPersist] = useState(false)
	const [estimating, setEstimating] = useState(false)
	const [nutrientsError, setNutrientsError] = useState<string | null>(null)

	// warn if edits would get discarded
	const [initialJson] = useState(() => JSON.stringify(toDraft(recipe)))
	const dirty = JSON.stringify(draft) !== initialJson
	const committingRef = useRef(false)
	const blocker = useBlocker(useCallback(() => dirty && !committingRef.current, [dirty]))
	useEffect(() => {
		if (!dirty) return
		const handler = (e: BeforeUnloadEvent) => e.preventDefault()
		window.addEventListener('beforeunload', handler)
		return () => window.removeEventListener('beforeunload', handler)
	}, [dirty])

	const titleInvalid = draft.title.trim() === ''
	const portionsInvalid = isInvalidCount(draft.portions)
	const nutrientInvalid = (key: (typeof NUTRIENTS)[number]['key']) => isInvalidAmount(draft.nutrients[key])
	const ingredientQtyInvalid = (ing: IngredientDraft) => !isBlankIngredient(ing) && isInvalidCount(ing.quantity)

	const recipeInvalid = titleInvalid ||
		portionsInvalid ||
		draft.ingredients.some(ingredientQtyInvalid)

	const hasErrors = recipeInvalid || NUTRIENTS.some((n) => nutrientInvalid(n.key))

	const estimatable =
    !recipeInvalid &&
    draft.ingredients.some((ing) => !isBlankIngredient(ing)) &&
    draft.instructions.some((step) => step.trim() !== '')

	// synchronized widths so the quantity and unit columns line up across every row
	const qtyColWidth = columnWidth(draft.ingredients.map((i) => i.quantity), 4)
	const unitColWidth = columnWidth(draft.ingredients.map((i) => i.unit), 6)

	function updateIngredient(index: number, patch: Partial<IngredientDraft>) {
		setDraft((d) => ({
			...d,
			ingredients: d.ingredients.map((ing, i) => (i === index ? { ...ing, ...patch } : ing)),
		}))
	}

	async function estimateNutrients() {
		if (!estimatable) return
		setEstimating(true)
		setNutrientsError(null)
		try {
			const res = await apiFetch('/ai/nutrients', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ recipe: buildRecipe(draft) }),
			})
			if (!res.ok) throw new Error(await errorMessage(res))
			const estimated = (await res.json()) as RecipeNutrients
			setDraft((d) => ({
				...d,
				nutrients: {
					calories: numToStr(estimated.calories),
					protein: numToStr(estimated.protein),
					fat: numToStr(estimated.fat),
					carbs: numToStr(estimated.carbs),
				},
			}))
		} catch (e) {
			if (e instanceof SessionExpiredError) return
			setNutrientsError(t('common.error', { message: e instanceof Error ? e.message : String(e) }))
		} finally {
			setEstimating(false)
		}
	}

	// `persist` only applies to a recipe that isn't in the library yet
	async function commitEdit(persist = false) {
		const body = buildRecipeInput(draft)
		committingRef.current = true
		setSaving(true)
		setSaveError(null)
		try {
			let updated: Recipe
			if (recipe.id != null) {
				const res = await apiFetch(`/recipes/${recipe.id}`, {
					method: 'PUT',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify(body),
				})
				if (!res.ok) throw new Error(await errorMessage(res))
				updated = (await res.json()) as Recipe
			} else if (persist) {
				const res = await apiFetch('/recipes', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify(body),
				})
				if (!res.ok) throw new Error(await errorMessage(res))
				const { id } = (await res.json()) as RecipeCreated
				updated = { ...body, id }
			} else {
				updated = body
			}
			onSaved(updated)
		} catch (e) {
			committingRef.current = false
			if (e instanceof SessionExpiredError) return
			setSaveError(t('common.error', { message: e instanceof Error ? e.message : String(e) }))
			setSaving(false)
		}
	}

	function handleSave() {
		if (hasErrors) return
		// an unsaved recipe first asks whether to also store it in the library
		if (recipe.id != null) void commitEdit()
		else setAskPersist(true)
	}

	return (
		<>
			{/* Cancel / Save above the recipe, styled like the recipe pager's arrows */}
			<div className="sticky top-0 z-30 -mx-6 -mt-6 flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-6 py-3 dark:border-neutral-700 dark:bg-neutral-900">
				<button
					type="button"
					onClick={onCancel}
					className="flex items-center gap-1 text-gray-500 dark:text-neutral-400 cursor-pointer transition-transform duration-100 hover:scale-98"
				>
					<ChevronLeftIcon className="h-5 w-5" />
					{t('common.cancel')}
				</button>
				<Button type="button" onClick={handleSave} disabled={saving || hasErrors}>
					{saving ? t('common.saving') : t('common.save')}
				</Button>
			</div>

			<div className="w-full flex flex-col gap-4">
				{/* Title */}
				<AutoTextarea
					value={draft.title}
					onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
					placeholder={t('recipe.titlePlaceholder')}
					aria-label={t('recipe.titlePlaceholder')}
					className={`w-full text-lg font-bold ${inputBase} ${borderFor(titleInvalid)}`}
				/>

				{/* Portions */}
				<label className="flex items-center gap-2">
					<input
						type="number"
						min={0.5}
						step={0.5}
						value={draft.portions}
						onChange={(e) => setDraft((d) => ({ ...d, portions: e.target.value }))}
						aria-label={t('recipe.portionsLabel')}
						className={`no-spinner w-14 text-right ${inputBase} ${borderFor(portionsInvalid)}`}
					/>
					<span className="text-gray-500 dark:text-neutral-400">
						{Number.parseFloat(draft.portions) <= 1 ? t('common.portion') : t('common.portions')}
					</span>
				</label>

				{/* Ingredients */}
				<div className={sectionCard}>
					<h3 className="text-lg font-bold">{t('recipe.ingredients')}</h3>
					<div className="mt-1 flex flex-col gap-2">
						{draft.ingredients.map((ing, j) => (
							<div key={j} className="flex items-center gap-2">
								<input
									type="number"
									step="any"
									min={0.5}
									value={ing.quantity}
									onChange={(e) => updateIngredient(j, { quantity: e.target.value })}
									placeholder={t('recipe.quantity')}
									aria-label={t('recipe.quantity')}
									style={{ width: qtyColWidth }}
									className={`no-spinner shrink-0 text-right ${inputBase} ${borderFor(ingredientQtyInvalid(ing))}`}
								/>
								<input
									type="text"
									value={ing.unit}
									onChange={(e) => updateIngredient(j, { unit: e.target.value })}
									placeholder={t('recipe.unit')}
									aria-label={t('recipe.unit')}
									style={{ width: unitColWidth }}
									className={`shrink-0 ${inputBase} ${neutralBorder}`}
								/>
								<input
									type="text"
									value={ing.name}
									onChange={(e) => updateIngredient(j, { name: e.target.value })}
									placeholder={t('recipe.ingredientName')}
									aria-label={t('recipe.ingredientName')}
									className={`min-w-0 flex-1 ${inputBase} ${neutralBorder}`}
								/>
								<button
									type="button"
									onClick={() =>
										setDraft((d) => ({ ...d, ingredients: d.ingredients.filter((_, i) => i !== j) }))
									}
									aria-label={t('recipe.removeIngredient')}
									className="cursor-pointer text-gray-400 dark:text-neutral-500 hover:text-red-600 dark:hover:text-red-400 transition-transform duration-100 hover:scale-98"
								>
									<TrashIcon className="h-5 w-5" />
								</button>
							</div>
						))}
						<button
							type="button"
							onClick={() =>
								setDraft((d) => ({ ...d, ingredients: [...d.ingredients, { quantity: '', unit: '', name: '' }] }))
							}
							className="flex items-center gap-2 self-center mt-1 cursor-pointer text-gray-500 dark:text-neutral-400 transition-transform duration-100 hover:scale-98"
						>
							<span className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-400 dark:border-neutral-500">
								<PlusIcon className="h-4 w-4 text-gray-400 dark:text-neutral-500 stroke-2" />
							</span>
							{t('recipe.addIngredient')}
						</button>
					</div>
				</div>

				{/* Instructions */}
				<div className={sectionCard}>
					<h3 className="text-lg font-bold">{t('recipe.instructions')}</h3>
					<div className="mt-1 flex flex-col gap-2">
						{draft.instructions.map((step, j) => (
							<div key={j} className="flex items-start gap-2">
								<span className="pt-2 text-sm font-medium text-gray-400 dark:text-neutral-500">{j + 1}.</span>
								<AutoTextarea
									value={step}
									onChange={(e) =>
										setDraft((d) => ({
											...d,
											instructions: d.instructions.map((s, i) => (i === j ? e.target.value : s)),
										}))
									}
									placeholder={t('recipe.stepPlaceholder')}
									aria-label={t('recipe.stepPlaceholder')}
									className={`min-w-0 flex-1 ${inputBase} ${neutralBorder}`}
								/>
								<button
									type="button"
									onClick={() =>
										setDraft((d) => ({ ...d, instructions: d.instructions.filter((_, i) => i !== j) }))
									}
									aria-label={t('recipe.removeStep')}
									className="mt-1 cursor-pointer text-gray-400 dark:text-neutral-500 hover:text-red-600 dark:hover:text-red-400 transition-transform duration-100 hover:scale-98"
								>
									<TrashIcon className="h-5 w-5" />
								</button>
							</div>
						))}
						<button
							type="button"
							onClick={() => setDraft((d) => ({ ...d, instructions: [...d.instructions, ''] }))}
							className="flex items-center gap-2 self-center mt-1 cursor-pointer text-gray-500 dark:text-neutral-400 transition-transform duration-100 hover:scale-98"
						>
							<span className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-400 dark:border-neutral-500">
								<PlusIcon className="h-4 w-4 text-gray-400 dark:text-neutral-500 stroke-2" />
							</span>
							{t('recipe.addStep')}
						</button>
					</div>
				</div>

				{/* Nutrients */}
				<div className={sectionCard}>
					<div className="flex items-center justify-between gap-3">
						<h3 className="text-lg font-bold">{t('recipe.nutrients')}</h3>
						<button
							type="button"
							onClick={() => void estimateNutrients()}
							disabled={estimating || !estimatable}
							className="flex items-center gap-1 text-gray-500 dark:text-neutral-400 cursor-pointer transition-transform duration-100 hover:scale-98 disabled:opacity-50 disabled:cursor-default"
						>
							<SparklesIcon className="h-5 w-5" />
							{estimating ? t('recipe.estimatingNutrients') : t('recipe.estimateNutrients')}
						</button>
					</div>
					<div className="mt-1 flex flex-col gap-2">
						{NUTRIENTS.map(({ key, labelKey, unit }) => (
							<label key={key} className="flex items-center gap-2">
								<input
									type="number"
									min={0}
									value={draft.nutrients[key]}
									disabled={estimating}
									onChange={(e) =>
										setDraft((d) => ({ ...d, nutrients: { ...d.nutrients, [key]: e.target.value } }))
									}
									aria-label={t(labelKey)}
									className={`no-spinner w-20 text-right ${inputBase} ${borderFor(nutrientInvalid(key))} disabled:opacity-50`}
								/>
								<span className="w-10 text-gray-500 dark:text-neutral-400">{unit}</span>
								<span className="font-medium">{t(labelKey)}</span>
							</label>
						))}
					</div>
					{nutrientsError && <p className="mt-2 text-red-600 dark:text-red-400">{nutrientsError}</p>}
				</div>

				{saveError && !askPersist && <p className="text-red-600 dark:text-red-400">{saveError}</p>}
			</div>

			{/* Saving an unsaved recipe: also store it in the library? */}
			{askPersist &&
				createPortal(
					<div
						role="dialog"
						aria-modal="true"
						aria-labelledby="recipe-persist-title"
						onClick={() => !saving && setAskPersist(false)}
						className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
					>
						<div
							onClick={(e) => e.stopPropagation()}
							className="w-full max-w-sm rounded-lg bg-white dark:bg-neutral-800 p-6 shadow-xl"
						>
							<h2 id="recipe-persist-title" className="text-lg font-medium text-gray-900 dark:text-neutral-100">
								{t('save.unsavedTitle')}
							</h2>
							{saveError && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{saveError}</p>}
							<div className="mt-6 flex flex-col gap-2">
								<button
									type="button"
									onClick={() => void commitEdit(true)}
									disabled={saving}
									className="rounded bg-orange-500 px-4 py-2 text-white cursor-pointer hover:bg-orange-600 disabled:opacity-50 disabled:cursor-default"
								>
									{t('save.toLibrary')}
								</button>
								<button
									type="button"
									onClick={() => void commitEdit(false)}
									disabled={saving}
									className="rounded border border-gray-300 dark:border-neutral-600 px-4 py-2 text-gray-700 dark:text-neutral-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-default"
								>
									{t('save.keepDraft')}
								</button>
								<button
									type="button"
									onClick={() => setAskPersist(false)}
									disabled={saving}
									className="rounded px-4 py-2 text-gray-500 dark:text-neutral-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-default"
								>
									{t('common.cancel')}
								</button>
							</div>
						</div>
					</div>,
					document.body,
				)}

			{/* Navigating away with unsaved edits */}
			{blocker.state === 'blocked' &&
				createPortal(
					<div
						role="dialog"
						aria-modal="true"
						aria-labelledby="recipe-discard-title"
						onClick={() => blocker.reset()}
						className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
					>
						<div
							onClick={(e) => e.stopPropagation()}
							className="w-full max-w-sm rounded-lg bg-white dark:bg-neutral-800 p-6 shadow-xl"
						>
							<h2 id="recipe-discard-title" className="text-lg font-medium text-gray-900 dark:text-neutral-100">
								{t('recipe.discardTitle')}
							</h2>
							<div className="mt-6 flex justify-end gap-2">
								<button
									type="button"
									onClick={() => blocker.reset()}
									className="rounded px-4 py-2 text-gray-700 dark:text-neutral-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700"
								>
									{t('recipe.keepEditing')}
								</button>
								<button
									type="button"
									onClick={() => blocker.proceed()}
									className="rounded bg-red-500 px-4 py-2 text-white cursor-pointer hover:bg-red-600"
								>
									{t('recipe.discard')}
								</button>
							</div>
						</div>
					</div>,
					document.body,
				)}
		</>
	)
}
