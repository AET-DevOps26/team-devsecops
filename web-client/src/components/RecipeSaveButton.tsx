import { useState } from 'react'
import type { MouseEvent } from 'react'
import { BookmarkIcon as BookmarkOutline } from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid'
import type { components } from '../api'
import { errorMessage } from '../apiError'
import { SessionExpiredError, useApi } from '../useApi'

type RecipeInput = components['schemas']['RecipeInput']
type RecipeCreated = components['schemas']['RecipeCreated']

export function RecipeSaveButton({
  recipe,
  recipeId,
  onSavedIdChange,
  className = '',
}: {
  recipe: RecipeInput
  recipeId?: number
  onSavedIdChange?: (id: number | undefined) => void
  className?: string
}) {
  const apiFetch = useApi()
  const [savedId, setSavedId] = useState<number | undefined>(recipeId)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const saved = savedId != null

  async function handleClick(e: MouseEvent) {
    e.stopPropagation()
    if (saving) return
    setSaving(true)
    setFailed(false)
    try {
      if (savedId != null) {
        const res = await apiFetch(`/api/v1/recipes/${savedId}`, { method: 'DELETE' })
        if (!res.ok) throw new Error(await errorMessage(res, `HTTP ${res.status}`))

				// mark as non-stored in sessionStorage
				for (const key of ['generated_recipes', 'library_recipes']) {
					const stored = sessionStorage.getItem(key)
					if (!stored) continue
					const recipes = JSON.parse(stored) as { id?: number }[]
					const next = recipes.map((r) => (r.id === savedId ? { ...r, id: undefined } : r))
					sessionStorage.setItem(key, JSON.stringify(next))
				}

        setSavedId(undefined)
        onSavedIdChange?.(undefined)
      } else {
        const body: RecipeInput = {
          title: recipe.title,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          portions: recipe.portions,
          nutrients: recipe.nutrients,
        }
        const res = await apiFetch('/api/v1/recipes', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error(await errorMessage(res, `HTTP ${res.status}`))
        const { id } = (await res.json()) as RecipeCreated
        setSavedId(id)
        onSavedIdChange?.(id)
      }
    } catch (e) {
      if (e instanceof SessionExpiredError) return
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }

  const Icon = saved ? BookmarkSolid : BookmarkOutline
  const title = failed
    ? 'Something went wrong, tap to retry'
    : saved
      ? 'Saved — tap to remove'
      : 'Save recipe'
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={saving}
      aria-label={saved ? 'Remove from collection' : 'Save recipe'}
      title={title}
      className={`flex h-9 w-9 items-center justify-center rounded-full cursor-pointer transition-transform duration-100 hover:scale-90 disabled:cursor-default disabled:hover:scale-100 ${className}`}
    >
      <Icon
        className={`h-6 w-6 ${saving ? 'animate-pulse' : ''} ${
          saved ? 'text-orange-500' : failed ? 'text-red-500' : 'text-gray-400'
        }`}
      />
    </button>
  )
}
