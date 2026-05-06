import { useState } from 'react'

// TODO: replace this with the actual call once the server works
async function mockGenerate(prompt: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 600))
  return `(mock) Recipe for: ${prompt}`
}

export function GeneratePage() {
  const [prompt, setPrompt] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setloading] = useState(false)

  async function handleGenerate() {
    setloading(true)
    const result = await mockGenerate(prompt)
    setOutput(result)
    setloading(false)
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
