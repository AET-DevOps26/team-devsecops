import { useState } from 'react'
import type { MouseEvent } from 'react'
import { BookmarkIcon as BookmarkOutline } from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid'
import type { components } from '../api'
import { errorMessage } from '../apiError'
import { isRecipeSaved, rememberRecipeSaved } from '../savedRecipes'
import { SessionExpiredError, useApi } from '../useApi'

type Recipe = components['schemas']['Recipe']
type RecipeInput = components['schemas']['RecipeInput']

// Bookmark button that toggles whether a recipe is in the user's collection:
// saving POSTs to /recipes, unsaving DELETEs /recipes/{id}. Unsave is only offered
// when the recipe's id is known (recipeId prop) — that's the library list. POST
// returns no id, so after a re-save we look the recipe back up by title to recover
// the new id (newest match) so it can be unsaved again. In save-only mode (no id, e.g.
// generated recipes) a save is remembered by title so the filled icon survives navigation.
export function SaveButton({
  recipe,
  recipeId,
  initiallySaved = false,
  className = '',
}: {
  recipe: RecipeInput
  recipeId?: number
  initiallySaved?: boolean
  className?: string
}) {
  const apiFetch = useApi()
  const canUnsave = recipeId != null
  const [saved, setSaved] = useState(canUnsave || initiallySaved || isRecipeSaved(recipe.title))
  const [savedId, setSavedId] = useState<number | undefined>(recipeId)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)

  // POST returns no id; recover it so a re-saved recipe can be unsaved again.
  async function findSavedId(): Promise<number | undefined> {
    const res = await apiFetch('/api/v1/recipes')
    if (!res.ok) return undefined
    const all = (await res.json()) as Recipe[]
    const matches = all.filter((r) => r.title === recipe.title).map((r) => r.id)
    return matches.length ? Math.max(...matches) : undefined
  }

  async function handleClick(e: MouseEvent) {
    e.stopPropagation()
    if (saving) return
    if (saved && !canUnsave) return // saved with no unsave support (e.g. generate page)
    setSaving(true)
    setFailed(false)
    try {
      if (saved) {
        if (savedId == null) throw new Error('Missing recipe id')
        const res = await apiFetch(`/api/v1/recipes/${savedId}`, { method: 'DELETE' })
        if (!res.ok) throw new Error(await errorMessage(res, `HTTP ${res.status}`))
        setSavedId(undefined)
        setSaved(false)
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
        if (canUnsave) setSavedId(await findSavedId())
        else rememberRecipeSaved(recipe.title)
        setSaved(true)
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
      ? canUnsave
        ? 'Saved — tap to remove'
        : 'Saved'
      : 'Save recipe'
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={saving || (saved && !canUnsave)}
      aria-label={saved ? (canUnsave ? 'Remove from collection' : 'Saved') : 'Save recipe'}
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
