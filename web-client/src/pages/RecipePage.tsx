import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowPathIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MinusIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import Markdown from 'react-markdown'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import type { components } from '../api'
import { SaveButton } from '../components/SaveButton'
import { formatQuantity } from '../recipeFormat'
import { usePressPulse } from '../usePressPulse'
import { errorMessage } from '../apiError'
import { SessionExpiredError, useApi } from '../useApi'

type Recipe = components['schemas']['Recipe']
type HelpRequest = components['schemas']['HelpRequest']
type HelpResponse = components['schemas']['HelpResponse']
type HelpEntry = { question: string; answer: string }

// recipes opened from the generate page aren't saved yet; those from the library are
type RecipeSource = 'generated' | 'library'
const SOURCE_STORAGE_KEY: Record<RecipeSource, string> = {
  generated: 'generated_recipes',
  library: 'library_recipes',
}

function toggleSetItem(set: Set<number>, item: number): Set<number> {
  const next = new Set(set)
  if (next.has(item)) next.delete(item)
  else next.add(item)
  return next
}

// Wrapper that keeps the recipe list and the help histories
export function RecipePage() {
  const location = useLocation()
  const state = location.state as { index?: number; source?: RecipeSource } | null
  const source: RecipeSource = state?.source ?? 'generated'
  const recipes = useMemo<Recipe[]>(() => {
    const stored = sessionStorage.getItem(SOURCE_STORAGE_KEY[source])
    return stored ? (JSON.parse(stored) as Recipe[]) : []
  }, [source])
  const index = state?.index ?? 0
  const recipe = recipes[index]

  const [helpAnswers, setHelpAnswers] = useState<Record<number, HelpEntry[]>>({})

  if (!recipe) return <Navigate to="/generate" replace />

  return (
    <RecipeView
      key={index}
      recipe={recipe}
      recipes={recipes}
      index={index}
      source={source}
      answers={helpAnswers[index] ?? []}
      onAnswer={(entry) =>
        setHelpAnswers((m) => ({ ...m, [index]: [entry, ...(m[index] ?? [])] }))
      }
    />
  )
}

function RecipeView({
  recipe,
  recipes,
  index,
  source,
  answers,
  onAnswer,
}: {
  recipe: Recipe
  recipes: Recipe[]
  index: number
  source: RecipeSource
  answers: HelpEntry[]
  onAnswer: (entry: HelpEntry) => void
}) {
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
  const navigateToRecipe = (index: number) =>
    navigate('/recipe', { state: { index, source }, replace: true })

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
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          nutrients: recipe.nutrients,
          portions,
        },
        prompt: question,
      }
      const response = await apiFetch('/api/v1/ai/help', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok) throw new Error(await errorMessage(response, `HTTP ${response.status}`))
      const data = (await response.json()) as HelpResponse
      onAnswer({ question, answer: data.response ?? 'No response.' })
      setHelpPrompt('')
    } catch (e) {
      if (e instanceof SessionExpiredError) return
      setHelpError(`Error: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setHelpLoading(false)
    }
  }

  return (
    <>
			{/* Back to /generate */}
      <button
        type="button"
        className="flex items-center gap-1 self-start text-gray-500 cursor-pointer transition-transform duration-100 hover:scale-98"
        onClick={() => navigate(-1)}
      >
        <ChevronLeftIcon className="h-5 w-5" />
        Back
      </button>

      <article className="relative w-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-4">

				{/* previous / next recipe (desktop) */}
        {recipes.length > 1 && (
          <>
            <button
              type="button"
              className="hidden lg:flex absolute top-1/2 -left-16 -translate-y-1/2 flex-col items-center gap-1 cursor-pointer text-gray-500 transition-transform duration-100 hover:scale-95 disabled:opacity-40 disabled:hover:scale-100"
              onClick={() => navigateToRecipe(index - 1)}
              disabled={index <= 0}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 shadow-sm">
                <ChevronLeftIcon className="h-5 w-5" />
              </span>
              <span className="text-xs">Previous</span>
            </button>
            <button
              type="button"
              className="hidden lg:flex absolute top-1/2 -right-16 -translate-y-1/2 flex-col items-center gap-1 cursor-pointer text-gray-500 transition-transform duration-100 hover:scale-95 disabled:opacity-40 disabled:hover:scale-100"
              onClick={() => navigateToRecipe(index + 1)}
              disabled={index >= recipes.length - 1}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 shadow-sm">
                <ChevronRightIcon className="h-5 w-5" />
              </span>
              <span className="text-xs">Next</span>
            </button>
          </>
        )}

				{/* Title & portion selector */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <h2 className="text-lg font-bold">{recipe.title}</h2>
            <SaveButton recipe={recipe} initiallySaved={source === 'library'} />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 cursor-pointer text-gray-600 transition-transform duration-100 hover:scale-95 disabled:opacity-40"
              onClick={() => setPortions((p) => Math.max(0.5, p - (p <= 5 ? 0.5 : 1)))}
              disabled={portions <= 0.5}
              aria-label="Decrease portions"
            >
              <MinusIcon className="h-4 w-4 stroke-2" />
            </button>
            <span className="w-20 text-center text-sm text-gray-600">
              {formatQuantity(portions)} {portions <= 1 ? 'portion' : 'portions'}
            </span>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 cursor-pointer text-gray-600 transition-transform duration-100 hover:scale-95"
              onClick={() => setPortions((p) => p + (p < 5 ? 0.5 : 1))}
              aria-label="Increase portions"
            >
              <PlusIcon className="h-4 w-4 stroke-2" />
            </button>
          </div>
        </header>

				{/* Ingredients */}
        <div>
          <h3 className="font-medium">Ingredients</h3>
          <ul className="flex flex-col gap-1">
            {recipe.ingredients.map((ing, j) => {
              const checked = checkedIngredients.has(j)
              return (
                <li key={j}>
                  <label className="flex items-baseline gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setCheckedIngredients((s) => toggleSetItem(s, j))}
                    />
                    <span className={checked ? 'line-through text-gray-400' : ''}>
                      {[
                        ing.quantity != null ? formatQuantity(ing.quantity, scale) : null,
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
          <h3 className="font-medium">Instructions</h3>
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
                    <span className="text-sm font-medium text-gray-400">{j + 1}.</span>
                    <span className={checked ? 'line-through text-gray-400' : ''}>{step}</span>
                  </button>
                </li>
              )
            })}
          </ol>
        </div>

				{/* Nutrients */}
        {recipe.nutrients && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            {recipe.nutrients.calories != null && <span>{Math.round(recipe.nutrients.calories * scale)} kcal</span>}
            {recipe.nutrients.protein != null && <span>{Math.round(recipe.nutrients.protein * scale)}g protein</span>}
            {recipe.nutrients.fat != null && <span>{Math.round(recipe.nutrients.fat * scale)}g fat</span>}
            {recipe.nutrients.carbs != null && <span>{Math.round(recipe.nutrients.carbs * scale)}g carbs</span>}
          </div>
        )}
      </article>

			{/* Get help */}
      <div className="w-full flex flex-col gap-3 py-4">
        <h3 className="font-medium">Get help</h3>
        <div className="relative">
          <textarea
            ref={helpInputRef}
            rows={1}
            className="w-full min-h-20 resize-none overflow-hidden border border-gray-300 rounded-lg p-3 pr-14"
            placeholder="Ask about this recipe (e.g. a substitution, a technique, what to serve it with)"
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
            className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-white cursor-pointer transition-transform duration-100 hover:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            onClick={handleGetHelp}
            disabled={helpLoading || helpPrompt.trim() === ''}
            aria-label="Get help"
          >
            {helpLoading ? (
              <ArrowPathIcon className="h-5 w-5 animate-spin [animation-duration:1.5s]" />
            ) : (
              <ArrowRightIcon className="h-5 w-5" />
            )}
          </button>
        </div>
        {helpError && <p className="text-red-600">{helpError}</p>}
      </div>

			{/* Preview while loading */}
      {helpLoading && (
        <div className="w-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-2">
          <p className="self-start rounded-lg bg-orange-50 px-3 py-2 font-medium text-orange-900 first-letter:uppercase">
            {pendingQuestion}
          </p>
          <p className="animate-pulse text-gray-400">Thinking…</p>
        </div>
      )}

			{/* Previous help queries */}
      {answers.map((entry, i) => (
        <div
          key={i}
          className="w-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-2"
        >
          <p className="self-start rounded-lg bg-orange-50 px-3 py-2 font-medium text-orange-900 first-letter:uppercase">
            {entry.question}
          </p>
          <div className="prose prose-sm max-w-none">
            <Markdown>{entry.answer}</Markdown>
          </div>
        </div>
      ))}

			{/* previous / next recipe (mobile) */}
			{recipes.length > 1 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-20 z-20 flex justify-center px-4 md:left-56 lg:hidden">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-gray-200 bg-white/90 py-2 pl-2 pr-2 shadow-lg backdrop-blur">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center cursor-pointer text-gray-600 transition-transform duration-100 hover:scale-95 disabled:opacity-40 disabled:hover:scale-100"
              onClick={() => navigateToRecipe(index - 1)}
              disabled={index <= 0}
              aria-label="Previous recipe"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <span className="text-sm text-gray-500 tabular-nums">
              {index + 1} of {recipes.length}
            </span>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center cursor-pointer text-gray-600 transition-transform duration-100 hover:scale-95 disabled:opacity-40 disabled:hover:scale-100"
              onClick={() => navigateToRecipe(index + 1)}
              disabled={index >= recipes.length - 1}
              aria-label="Next recipe"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* room to scroll the last card above the floating prev/next bar */}
      {recipes.length > 1 && <div aria-hidden className="h-24 lg:hidden" />}
    </>
  )
}
