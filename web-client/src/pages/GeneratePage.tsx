import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { components } from '../api'
import { useAuth } from '../auth'
import { Button } from '../components/Button'
import { formatQuantity } from '../recipeFormat'
import { usePressPulse } from '../usePressPulse'

type Recipe = components['schemas']['Recipe']
type RecipeRequest = components['schemas']['RecipeRequest']

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export function GeneratePage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [generateBtnRef, pulseGenerate] = usePressPulse<HTMLButtonElement>()
  const [prompt, setPrompt] = useState('')
  // keep the last results so the list is restored when returning from a recipe page
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const stored = sessionStorage.getItem('generated_recipes')
    return stored ? (JSON.parse(stored) as Recipe[]) : []
  })
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    sessionStorage.setItem('generated_recipes', JSON.stringify(recipes))
  }, [recipes])

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
            if (!loading && prompt.trim() !== '') {
              pulseGenerate()
              handleGenerate()
            }
          }
        }}
      />
      <Button
        ref={generateBtnRef}
        type="button"
        className="self-start"
        onClick={handleGenerate}
        disabled={loading || prompt.trim() === ''}
      >
        {loading ? 'Generating…' : 'Generate'}
      </Button>

      {status && <p className="text-gray-600">{status}</p>}

      {recipes.map((recipe, i) => (
        <button
          key={i}
          type="button"
          onClick={() => navigate('/recipe', { state: { index: i } })}
          className="w-full text-left rounded-lg border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-3 cursor-pointer transition-transform duration-100 hover:scale-98"
        >
          <header className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-bold">{recipe.title}</h2>
            <span className="text-sm text-gray-500">
              {recipe.portions} {recipe.portions === 1 ? 'portion' : 'portions'}
            </span>
          </header>

          <div>
            <ul className="list-disc pl-5">
              {recipe.ingredients.map((ing, j) => (
                <li key={j}>
                  {[
                    ing.quantity != null ? formatQuantity(ing.quantity) : null,
                    ing.unit,
                    ing.name,
                  ]
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
        </button>
      ))}
    </>
  )
}
