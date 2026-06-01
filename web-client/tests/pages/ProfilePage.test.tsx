import { Route, Routes } from 'react-router-dom'
import { act, screen, waitFor } from '@testing-library/react'
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

  // The taste-preferences card has no submit button; saving happens
  // automatically a short while after the user stops typing.
  describe('taste-preferences autosave', () => {
    // the indicator that is currently doing something (everything else is idle)
    const activeIndicator = () =>
      document.querySelector('[data-status]:not([data-status="idle"])')
    const status = () => activeIndicator()?.getAttribute('data-status') ?? 'idle'

    const putCalls = () =>
      fetchMock.mock.calls.filter(([, init]) => init?.method === 'PUT')
    const lastPutBody = () => {
      const calls = putCalls()
      return JSON.parse(calls[calls.length - 1][1]!.body as string)
    }

    // render, then let the initial GET /profile resolve before interacting so
    // it can't clobber what the user types
    async function renderSettled() {
      render()
      await act(async () => {
        for (let i = 0; i < 5; i++) await Promise.resolve()
      })
    }

    // resolve a deferred fetch and flush the state updates it triggers
    async function resolveAndFlush(fn: () => void) {
      await act(async () => {
        fn()
        for (let i = 0; i < 5; i++) await Promise.resolve()
      })
    }

    it('has no "Update taste preferences" button', async () => {
      defaultProfileFetch({ username: 'alice' })
      await renderSettled()
      expect(
        screen.queryByRole('button', { name: 'Update taste preferences' }),
      ).toBeNull()
    })

    it('shows a spinner while typing, then saves the trimmed value after a pause and flashes a check that fades out', async () => {
      defaultProfileFetch({ username: 'alice' })
      const user = userEvent.setup()
      await renderSettled()

      await user.type(screen.getByLabelText('About me'), '  spicy food  ')

      // spinner is showing immediately and nothing has been sent yet
      expect(status()).toBe('saving')
      expect(putCalls()).toHaveLength(0)

      // once the user pauses, the request goes out with the trimmed value
      await waitFor(() => expect(putCalls()).toHaveLength(1), { timeout: 2000 })
      expect(lastPutBody().preferences.aboutMe).toEqual(['spicy food'])

      // the green check appears...
      await waitFor(() => expect(status()).toBe('saved'))
      // ...and clears itself shortly after
      await waitFor(() => expect(activeIndicator()).toBeNull(), { timeout: 2000 })
    })

    it('debounces a burst of keystrokes into a single request', async () => {
      defaultProfileFetch({ username: 'alice' })
      const user = userEvent.setup()
      await renderSettled()

      // two bursts typed back-to-back (well within the debounce window)
      const aboutMe = screen.getByLabelText('About me')
      await user.type(aboutMe, 'ab')
      await user.type(aboutMe, 'cd')

      await waitFor(() => expect(putCalls()).toHaveLength(1), { timeout: 2000 })
      expect(lastPutBody().preferences.aboutMe).toEqual(['abcd'])
    })

    it('strips empty diet/allergy entries before sending', async () => {
      defaultProfileFetch({ username: 'alice' })
      const user = userEvent.setup()
      await renderSettled()

      // fill only the first allergy slot; the lone diet slot stays empty
      const allergyInputs = screen.getAllByPlaceholderText(/e\.g\. (peanuts|shellfish)/i)
      await user.type(allergyInputs[0], 'peanuts')

      await waitFor(() => expect(putCalls()).toHaveLength(1), { timeout: 2000 })
      const body = lastPutBody()
      expect(body.preferences.allergies).toEqual(['peanuts'])
      expect(body.preferences.diet).toEqual([])
    })

    it('keeps spinning with a check in the middle when the user types during the save, then saves again', async () => {
      // PUTs resolve only when we say so, so we can type mid-flight
      const pending: Array<() => void> = []
      fetchMock.mockImplementation((_input, init) => {
        const method = init?.method ?? 'GET'
        if (method === 'GET') {
          return Promise.resolve(jsonResponse({ username: 'alice', preferences: {} }))
        }
        return new Promise<Response>((resolve) => {
          pending.push(() => resolve(jsonResponse({})))
        })
      })
      const user = userEvent.setup()
      await renderSettled()

      const aboutMe = screen.getByLabelText('About me')
      await user.type(aboutMe, 'a')
      // first request fires after the debounce and is now in flight
      await waitFor(() => expect(pending).toHaveLength(1), { timeout: 2000 })
      expect(status()).toBe('saving')

      // user keeps typing before the server answers
      await user.type(aboutMe, 'b')

      // first request succeeds → check shown in the middle, but still spinning
      await resolveAndFlush(pending[0])
      expect(status()).toBe('resaving')

      // having stopped typing, the latest value is saved again
      await waitFor(() => expect(pending).toHaveLength(2), { timeout: 2000 })
      await resolveAndFlush(pending[1])
      expect(lastPutBody().preferences.aboutMe).toEqual(['ab'])
      await waitFor(() => expect(status()).toBe('saved'))
    })

    it('surfaces a server error when the save fails', async () => {
      fetchMock.mockImplementation((_input, init) => {
        const method = init?.method ?? 'GET'
        if (method === 'GET') {
          return Promise.resolve(jsonResponse({ username: 'alice', preferences: {} }))
        }
        return Promise.resolve(jsonResponse({ message: 'Server on fire' }, { status: 500 }))
      })
      const user = userEvent.setup()
      await renderSettled()

      await user.type(screen.getByLabelText('About me'), 'spicy')

      // the error is surfaced and the spinner is gone
      await waitFor(() => expect(screen.getByText('Server on fire')).toBeInTheDocument(), {
        timeout: 2000,
      })
      expect(activeIndicator()).toBeNull()
    })
  })
})
