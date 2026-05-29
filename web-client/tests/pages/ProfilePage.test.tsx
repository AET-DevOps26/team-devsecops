import { Route, Routes } from 'react-router-dom'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, vi } from 'vitest'
import { ProfilePage } from '../../src/pages/ProfilePage'
import { jsonResponse, renderWithProviders } from '../utils'

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

function render() {
  renderWithProviders(
    <Routes>
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/login" element={<div>login page</div>} />
    </Routes>,
    { route: '/profile', token: { value: 'tkn', username: 'alice' } },
  )
}

function defaultProfileFetch(body: { username: string }) {
  fetchMock.mockImplementation((_input, init) => {
    const method = init?.method ?? 'GET'
    if (method === 'GET') {
      return Promise.resolve(jsonResponse({ username: body.username, preferences: {} }))
    }
    return Promise.resolve(jsonResponse({}))
  })
}

describe('ProfilePage', () => {
  it('blocks the password update when the two fields disagree (no PUT issued)', async () => {
    defaultProfileFetch({ username: 'alice' })
    const user = userEvent.setup()
    render()
    await user.type(screen.getByLabelText('New password'), 'aaa')
    await user.type(screen.getByLabelText('Repeat new password'), 'bbb')

    await user.click(screen.getByRole('button', { name: 'Update password' }))

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'PUT')).toHaveLength(0)
  })

  it('strips empty diet/allergy entries before sending the preferences PUT', async () => {
    defaultProfileFetch({ username: 'alice' })
    const user = userEvent.setup()
    render()
    // fill only the first allergy slot; the second stays empty
    const allergyInputs = await screen.findAllByPlaceholderText(/e\.g\. (peanuts|shellfish)/i)
    await user.type(allergyInputs[0], 'peanuts')

    await user.click(screen.getByRole('button', { name: 'Update taste preferences' }))

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT'),
      ).toBeDefined()
    })
    const putCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT')!
    const body = JSON.parse(putCall[1]!.body as string)
    expect(body.preferences.allergies).toEqual(['peanuts'])
    expect(body.preferences.diet).toEqual([])
  })

  it('shows "Username already taken" on a 409 from the username PUT', async () => {
    fetchMock.mockImplementation((_input, init) => {
      const method = init?.method ?? 'GET'
      if (method === 'GET') {
        return Promise.resolve(jsonResponse({ username: 'alice', preferences: {} }))
      }
      return Promise.resolve(
        jsonResponse({ message: 'Username already taken' }, { status: 409 }),
      )
    })
    const user = userEvent.setup()
    render()
    const usernameField = await screen.findByLabelText('New username')
    await user.clear(usernameField)
    await user.type(usernameField, 'bob')

    await user.click(screen.getByRole('button', { name: 'Update username' }))

    expect(await screen.findByText('Username already taken')).toBeInTheDocument()
  })
})
