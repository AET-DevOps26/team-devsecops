import { useState } from 'react'
import type { components } from '../api'
import { Button } from '../components/Button'

type HelpResponse = components['schemas']['HelpResponse']

export function GeneratePage() {
  const [prompt, setPrompt] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setloading] = useState(false)

  async function handleGenerate() {
    setloading(true)
    setOutput('Generating response... (this might take a while)')
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE ?? ''}/api/v1/ai/help`, {
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
      {output && (
        <pre className="whitespace-pre-wrap border border-gray-200 rounded p-3 bg-gray-50">
          {output}
        </pre>
      )}
    </>
  )
}
