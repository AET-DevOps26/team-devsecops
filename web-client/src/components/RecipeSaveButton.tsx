import { useEffect, useRef, useState } from 'react'
import type { MouseEvent, RefObject } from 'react'
import { createPortal } from 'react-dom'
import {
  BookmarkIcon as BookmarkOutline,
  TrashIcon as TrashOutline,
  XMarkIcon,
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
  confirmContainer,
  className = '',
}: {
  recipe: RecipeInput
  recipeId?: number
  onSavedIdChange?: (id: number | undefined) => void
  onDeleted?: () => void
  // When set, the confirm dialog is scoped (absolute) to this element instead of covering the whole viewport
  confirmContainer?: RefObject<HTMLElement | null>
  className?: string
}) {
  const apiFetch = useApi()
  const [savedId, setSavedId] = useState<number | undefined>(recipeId)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [suppressTrash, setSuppressTrash] = useState(false)
  const hoveredRef = useRef(false)
  const saved = savedId != null
	// suppress trash icon until mouse left the bookmark icon after click
  const showTrash = saved && !suppressTrash

  // auto-dismiss the error toast after a few seconds
  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(null), 5000)
    return () => clearTimeout(timer)
  }, [error])

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
    setError(null)
    try {
      if (savedId != null) {
        const res = await apiFetch(`/recipes/${savedId}`, { method: 'DELETE' })
        if (!res.ok) throw new Error(await errorMessage(res, 'Could not remove the recipe.'))

				// mark as non-stored if in the generated-recipes list
				const stored = sessionStorage.getItem('generated_recipes')
				if (stored) {
					const recipes = JSON.parse(stored) as { id?: number }[]
					const next = recipes.map((r) => (r.id === savedId ? { ...r, id: undefined } : r))
					sessionStorage.setItem('generated_recipes', JSON.stringify(next))
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
        const res = await apiFetch('/recipes', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error(await errorMessage(res, 'Could not save the recipe.'))
        const { id } = (await res.json()) as RecipeCreated
        setSavedId(id)
        onSavedIdChange?.(id)
        if (hoveredRef.current) setSuppressTrash(true)
      }
    } catch (e) {
      if (e instanceof SessionExpiredError) return
      setFailed(true)
      setError(e instanceof Error ? e.message : 'Something went wrong.')
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

      {confirming &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="recipe-delete-title"
            onClick={cancelDelete}
            className={`z-50 flex items-center justify-center bg-black/40 p-4 ${
              confirmContainer ? 'absolute inset-0' : 'fixed inset-0'
            }`}
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
          </div>,
          confirmContainer?.current ?? document.body,
        )}

      {error &&
        createPortal(
          <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
            <div
              role="alert"
              className="pointer-events-auto flex max-w-md items-start gap-3 rounded-lg bg-red-600 px-4 py-3 text-sm text-white shadow-lg"
            >
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                aria-label="Dismiss"
                className="-mr-1 shrink-0 cursor-pointer text-white/80 hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
