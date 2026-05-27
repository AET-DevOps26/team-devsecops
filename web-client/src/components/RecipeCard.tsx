import type { KeyboardEvent } from 'react'
import type { components } from '../api'
import { formatQuantity } from '../recipeFormat'
import { RecipeSaveButton } from './RecipeSaveButton.tsx'

type RecipeInput = components['schemas']['RecipeInput']

// Preview card showing a recipe summary plus a heart to save it.
// Opens the full recipe view on click. Used on the generate and library pages.
export function RecipeCard({
  recipe,
  onOpen,
  recipeId,
  onSavedIdChange,
}: {
  recipe: RecipeInput
  onOpen: () => void
  recipeId?: number
  onSavedIdChange?: (id: number | undefined) => void
}) {
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpen()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      className="w-full text-left rounded-lg border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-3 cursor-pointer transition-transform duration-100 hover:scale-99"
    >
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold">{recipe.title}</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {recipe.portions} {recipe.portions === 1 ? 'portion' : 'portions'}
          </span>
          <RecipeSaveButton
            recipe={recipe}
            recipeId={recipeId}
            onSavedIdChange={onSavedIdChange}
            className="-my-2"
          />
        </div>
      </header>

      <div>
        <ul className="list-disc pl-5">
          {recipe.ingredients.map((ing, j) => (
            <li key={j}>
              {[ing.quantity != null ? formatQuantity(ing.quantity) : null, ing.unit, ing.name]
                .filter(Boolean)
                .join(' ')}
            </li>
          ))}
        </ul>
      </div>

      {recipe.nutrients && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
          {recipe.nutrients.calories != null && <span>{recipe.nutrients.calories} kcal</span>}
          {recipe.nutrients.protein != null && <span>{recipe.nutrients.protein}g protein</span>}
          {recipe.nutrients.fat != null && <span>{recipe.nutrients.fat}g fat</span>}
          {recipe.nutrients.carbs != null && <span>{recipe.nutrients.carbs}g carbs</span>}
        </div>
      )}
    </div>
  )
}
