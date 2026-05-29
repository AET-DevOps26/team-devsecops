import { errorMessage } from '../src/apiError'

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 400,
    headers: { 'content-type': 'application/json' },
  })
}

describe('errorMessage', () => {
  it('returns the server message when present', async () => {
    const res = jsonResponse({ message: 'Username already taken' })

    const message = await errorMessage(res, 'fallback')

    expect(message).toBe('Username already taken')
  })

  it('falls back when the body is missing a message or unparseable', async () => {
    const whitespaceMessage = jsonResponse({ message: '   ' })
    const garbage = new Response('not json', { status: 500 })

    const fromWhitespace = await errorMessage(whitespaceMessage, 'fallback')
    const fromGarbage = await errorMessage(garbage, 'fallback')

    expect(fromWhitespace).toBe('fallback')
    expect(fromGarbage).toBe('fallback')
  })
})
