import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpenIcon } from '@heroicons/react/24/outline'
import { BoltIcon, BookmarkIcon } from '@heroicons/react/24/solid'
import type { components } from '../api'
import { RecipeCard } from '../components/RecipeCard'
import { errorMessage } from '../apiError'
import { SessionExpiredError, useApi } from '../useApi'

type Recipe = components['schemas']['Recipe']

export function LibraryPage() {
  const apiFetch = useApi()
  const navigate = useNavigate()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await apiFetch('/api/v1/recipes')
        if (!res.ok) throw new Error(await errorMessage(res, `HTTP ${res.status}`))
        const data = ((await res.json()) as Recipe[]).reverse() // newest recipe first
        if (cancelled) return
        // keep the list so the recipe view can read it (incl. prev/next navigation)
        sessionStorage.setItem('library_recipes', JSON.stringify(data))
        setRecipes(data)
        setPhase('ready')
      } catch (e) {
        if (cancelled || e instanceof SessionExpiredError) return
        setError(`Error: ${e instanceof Error ? e.message : String(e)}`)
        setPhase('error')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [apiFetch])

  if (phase === 'loading') return <p className="text-gray-500">Loading…</p>
  if (phase === 'error') return <p className="text-red-600">{error}</p>

  if (recipes.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <BookOpenIcon className="h-12 w-12 text-orange-200" />
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold">Your cookbook is empty</h2>
          <p className="max-w-xs text-gray-500">
            Nothing saved yet. Cook up some ideas and tap the{' '}
            <BookmarkIcon className="inline h-4 w-4 -translate-y-0.5 text-orange-400" /> to stash
            your favourites here.
          </p>
        </div>
        <Link
          to="/generate"
          className="flex items-center gap-2 rounded bg-orange-500 px-4 py-2 text-white transition-transform duration-100 hover:scale-98"
        >
          <BoltIcon className="h-5 w-5" />
          Generate a recipe
        </Link>
      </div>
    )
  }

  return (
    <div className="columns-1 gap-4 md:columns-2 lg:columns-3">
      {recipes.map((recipe, i) => (
        <div
          key={recipe.id}
          className="mb-4 break-inside-avoid"
          style={{ viewTransitionName: `recipe-card-${recipe.id}` }}
        >
          <RecipeCard
            recipe={recipe}
            recipeId={recipe.id}
            onSavedIdChange={(newId) => {
              if (newId != null) return

							// this recipe got deleted, make the others rearrange with a smooth transition
              const apply = () => {
                flushSync(() => {
                  setRecipes((prev) => {
                    const next = prev.filter((r) => r.id !== recipe.id)
                    sessionStorage.setItem('library_recipes', JSON.stringify(next))
                    return next
                  })
                })
              }
              if (document.startViewTransition) document.startViewTransition(apply)
              else apply()
            }}
            onOpen={() => navigate('/recipe', { state: { index: i, source: 'library' } })}
          />
        </div>
      ))}
    </div>
  )
}
