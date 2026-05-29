import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import type { InitialEntry } from 'react-router-dom'
import { render } from '@testing-library/react'
import { AuthProvider } from '../src/auth'

export function renderWithProviders(
  ui: ReactElement,
  { route = '/', token }: { route?: InitialEntry; token?: { value: string; username: string } } = {},
) {
  if (token) {
    localStorage.setItem('auth_token', token.value)
    localStorage.setItem('auth_username', token.username)
  }
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
  )
}

export function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  })
}
