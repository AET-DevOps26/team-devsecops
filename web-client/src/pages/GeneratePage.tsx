import { useState } from 'react'
import type { components } from '../api'

type HelpResponse = components['schemas']['HelpResponse']

export function GeneratePage() {
  const [prompt, setPrompt] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setloading] = useState(false)

  async function handleGenerate() {
    setloading(true)
		setOutput('Generating response... (this might take a while)')
    try {
      const response = await fetch('/api/v1/ai/help', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = (await response.json()) as HelpResponse
      setOutput(data.response ?? '(empty response)')
    } catch (e) {
      setOutput(`Error: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setloading(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Cooking Assistant</h1>
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
      <button
        type="button"
        className="self-start px-4 py-2 bg-orange-500 text-white rounded disabled:opacity-50"
        onClick={handleGenerate}
        disabled={loading || prompt.trim() === ''}
      >
        {loading ? 'Generating…' : 'Generate'}
      </button>
      {output && (
        <pre className="whitespace-pre-wrap border border-gray-200 rounded p-3 bg-gray-50">
          {output}
        </pre>
      )}
    </main>
  )
}
