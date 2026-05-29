import { useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import {
  BookmarkIcon as BookmarkOutline,
  TrashIcon as TrashOutline,
} from '@heroicons/react/24/outline'
import {
  BookmarkIcon as BookmarkSolid,
  TrashIcon as TrashSolid,
} from '@heroicons/react/24/solid'
import type { components } from '../api'
import { errorMessage } from '../apiError'
import { SessionExpiredError, useApi } from '../useApi'

type RecipeInput = components['schemas']['RecipeInput']
type RecipeCreated = components['schemas']['RecipeCreated']

export function RecipeSaveButton({
  recipe,
  recipeId,
  onSavedIdChange,
  onDeleted,
  className = '',
}: {
  recipe: RecipeInput
  recipeId?: number
  onSavedIdChange?: (id: number | undefined) => void
  onDeleted?: () => void
  className?: string
}) {
  const apiFetch = useApi()
  const [savedId, setSavedId] = useState<number | undefined>(recipeId)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [suppressTrash, setSuppressTrash] = useState(false)
  const hoveredRef = useRef(false)
  const saved = savedId != null
	// suppress trash icon until mouse left the bookmark icon after click
  const showTrash = saved && !suppressTrash

  function handleClick(e: MouseEvent) {
    e.stopPropagation()
    if (saving) return
    if (savedId != null) {
      setConfirming(true)
      return
    }
    void runSave()
  }

  async function runSave() {
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
        onDeleted?.()
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
        if (hoveredRef.current) setSuppressTrash(true)
      }
    } catch (e) {
      if (e instanceof SessionExpiredError) return
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }

  const Outline = showTrash ? TrashOutline : BookmarkOutline
  const Solid = showTrash ? TrashSolid : BookmarkSolid
  const fillColor = showTrash ? 'text-red-500' : 'text-orange-500'
  const title = failed
    ? 'Something went wrong, tap to retry'
    : saved
      ? 'Saved — tap to remove'
      : 'Save recipe'

  function confirmDelete(e: MouseEvent) {
    e.stopPropagation()
    setConfirming(false)
    void runSave()
  }

  function cancelDelete(e: MouseEvent) {
    e.stopPropagation()
    setConfirming(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={() => {
          hoveredRef.current = true
        }}
        onMouseLeave={() => {
          hoveredRef.current = false
          setSuppressTrash(false)
        }}
        disabled={saving}
        aria-label={saved ? 'Remove from collection' : 'Save recipe'}
        title={title}
        className={`group relative flex h-9 w-9 items-center justify-center rounded-full cursor-pointer disabled:cursor-default ${className}`}
      >
        <span className={`relative h-6 w-6 ${saving ? 'animate-pulse' : ''}`}>
          <Outline
            className={`absolute inset-0 h-6 w-6 transition-colors duration-300 ease-out group-hover:text-white ${failed || showTrash ? 'text-red-500' : 'text-gray-400'}`}
          />
          <Solid
            className={`absolute inset-0 h-6 w-6 ${fillColor} [clip-path:inset(100%_0_0_0)] transition-[clip-path] duration-300 ease-out group-hover:[clip-path:inset(0_0_0_0)]`}
          />
        </span>
      </button>

			{/* Deletion confimation dialog */}
      {confirming && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="recipe-delete-title"
          onClick={cancelDelete}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
          >
            <h2 id="recipe-delete-title" className="text-lg font-medium text-gray-900">
              Delete recipe from library?
            </h2>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={cancelDelete}
                className="px-4 py-2 rounded text-gray-700 cursor-pointer hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded bg-red-500 text-white cursor-pointer hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
