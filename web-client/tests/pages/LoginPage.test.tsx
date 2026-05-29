import { Route, Routes } from 'react-router-dom'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, vi } from 'vitest'
import { LoginPage } from '../../src/pages/LoginPage'
import { jsonResponse, renderWithProviders } from '../utils'

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

function renderLogin(opts?: Parameters<typeof renderWithProviders>[1]) {
  renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/generate" element={<div>generate page</div>} />
    </Routes>,
    { route: '/login', ...opts },
  )
}

describe('LoginPage', () => {
  it('blocks register submit when passwords do not match (no network call)', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('button', { name: 'Register' }))
    await user.type(screen.getByLabelText('Username'), 'alice')
    await user.type(screen.getByLabelText('Password'), 'one')
    await user.type(screen.getByLabelText('Repeat password'), 'two')

    await user.click(screen.getByRole('button', { name: 'Sign up' }))

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('surfaces the server error message on a failed login', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Nope' }, { status: 401 }))
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByLabelText('Username'), 'alice')
    await user.type(screen.getByLabelText('Password'), 'wrong')

    await user.keyboard('{Enter}')

    expect(await screen.findByText('Nope')).toBeInTheDocument()
  })

  it('redirects to /generate when already signed in', async () => {
    renderLogin({ token: { value: 'tkn', username: 'alice' } })

    await waitFor(() => expect(screen.getByText('generate page')).toBeInTheDocument())
  })
})
