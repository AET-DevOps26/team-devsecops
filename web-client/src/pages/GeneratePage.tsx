import { useState } from 'react'
import type { components } from '../api'
import { useAuth } from '../auth'
import { Button } from '../components/Button'

type Recipe = components['schemas']['Recipe']
type RecipeRequest = components['schemas']['RecipeRequest']

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export function GeneratePage() {
  const { token } = useAuth()
  const [prompt, setPrompt] = useState('')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    setStatus('Generating recipes… (this might take a while)')
    setRecipes([])
    try {
      const body: RecipeRequest = { prompt }
      const response = await fetch(`${API_BASE}/api/v1/ai/recipes`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = (await response.json()) as Recipe[]
      setRecipes(data)
      setStatus(data.length === 0 ? 'No recipes returned.' : null)
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <textarea
        className="w-full min-h-32 border border-gray-300 rounded p-3"
        placeholder="What do you want to cook? (e.g. ingredients, cuisine, constraints)"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            // on Enter: directly submit instead of adding a new line
            e.preventDefault()
            if (!loading && prompt.trim() !== '') handleGenerate()
          }
        }}
      />
      <Button
        type="button"
        className="self-start"
        onClick={handleGenerate}
        disabled={loading || prompt.trim() === ''}
      >
        {loading ? 'Generating…' : 'Generate'}
      </Button>

      {status && <p className="text-gray-600">{status}</p>}

      {recipes.map((recipe, i) => (
        <article
          key={i}
          className="w-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-3"
        >
          <header className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-bold">{recipe.title}</h2>
            <span className="text-sm text-gray-500">
              {recipe.portions} {recipe.portions === 1 ? 'portion' : 'portions'}
            </span>
          </header>

          <div>
            <h3 className="font-medium">Ingredients</h3>
            <ul className="list-disc pl-5">
              {recipe.ingredients.map((ing, j) => (
                <li key={j}>
                  {[ing.quantity, ing.unit, ing.name].filter(Boolean).join(' ')}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-medium">Instructions</h3>
            <ol className="list-decimal pl-5">
              {recipe.instructions.map((step, j) => (
                <li key={j}>{step}</li>
              ))}
            </ol>
          </div>

          {recipe.nutrients && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
              {recipe.nutrients.calories != null && <span>{recipe.nutrients.calories} kcal</span>}
              {recipe.nutrients.protein != null && <span>{recipe.nutrients.protein}g protein</span>}
              {recipe.nutrients.fat != null && <span>{recipe.nutrients.fat}g fat</span>}
              {recipe.nutrients.carbs != null && <span>{recipe.nutrients.carbs}g carbs</span>}
            </div>
          )}
        </article>
      ))}
    </>
  )
}
