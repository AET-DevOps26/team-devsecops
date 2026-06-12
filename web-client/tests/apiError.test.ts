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

		const message = await errorMessage(res)

		expect(message).toBe('Username already taken')
	})

	it('falls back to a status message when the body has no usable message', async () => {
		const whitespaceMessage = jsonResponse({ message: '   ' }) // status 400
		const garbage = new Response('not json', { status: 500 })

		expect(await errorMessage(whitespaceMessage)).toBe('An error occured. (HTTP 400)')
		expect(await errorMessage(garbage)).toBe('An error occured. (HTTP 500)')
	})
})
