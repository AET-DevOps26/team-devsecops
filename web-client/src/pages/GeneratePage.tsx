import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { components } from '../api'
import { Button } from '../components/Button'
import { RecipeCard } from '../components/RecipeCard'
import { usePressPulse } from '../usePressPulse'
import { errorMessage } from '../apiError'
import { clearSavedRecipes } from '../savedRecipes'
import { SessionExpiredError, useApi } from '../useApi'

type Recipe = components['schemas']['Recipe']
type RecipeRequest = components['schemas']['RecipeRequest']

export function GeneratePage() {
  const apiFetch = useApi()
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
    clearSavedRecipes() // invalidate the "saved" markers from the previous run
    try {
      const body: RecipeRequest = { prompt }
      const response = await apiFetch('/api/v1/ai/recipes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok) throw new Error(await errorMessage(response, `HTTP ${response.status}`))
      const data = (await response.json()) as Recipe[]
      setRecipes(data)
      setStatus(data.length === 0 ? 'No recipes returned.' : null)
    } catch (e) {
      if (e instanceof SessionExpiredError) return
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
        <RecipeCard
          key={i}
          recipe={recipe}
          onOpen={() => navigate('/recipe', { state: { index: i, source: 'generated' } })}
        />
      ))}
    </>
  )
}
