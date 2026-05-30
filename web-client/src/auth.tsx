import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { errorMessage } from './apiError'

const TOKEN_KEY = 'auth_token'
const USERNAME_KEY = 'auth_username'
const API_BASE = import.meta.env.VITE_API_BASE ?? ''

async function loginRequest(username: string, password: string): Promise<string> {
  if (!username.trim() || !password) throw new Error('Enter a username and password')
  const res = await fetch(`${API_BASE}/api/v1/users/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (res.status === 401) throw new Error(await errorMessage(res, 'Invalid username or password'))
  if (!res.ok) throw new Error(await errorMessage(res, `Couldn't log in (HTTP ${res.status})`))
  const data = (await res.json()) as { token: string }
  return data.token
}

async function registerRequest(username: string, password: string): Promise<void> {
  if (!username.trim() || !password) throw new Error('Enter a username and password')
  const res = await fetch(`${API_BASE}/api/v1/users/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (res.status === 409) throw new Error(await errorMessage(res, 'Username already taken'))
  if (!res.ok) throw new Error(await errorMessage(res, `Couldn't sign up (HTTP ${res.status})`))
}

async function logoutRequest(token: string): Promise<void> {
  await fetch(`${API_BASE}/api/v1/users/logout`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
  })
}

type AuthContextValue = {
  token: string | null
  username: string | null
  signIn: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  updateUsername: (username: string) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem(USERNAME_KEY))

  function persistSession(newToken: string, newUsername: string) {
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USERNAME_KEY, newUsername)
    setToken(newToken)
    setUsername(newUsername)
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USERNAME_KEY)
    sessionStorage.clear()
    setToken(null)
    setUsername(null)
  }

  const value: AuthContextValue = {
    token,
    username,
    signIn: async (u, p) => persistSession(await loginRequest(u, p), u),
    register: async (u, p) => {
      await registerRequest(u, p)
      persistSession(await loginRequest(u, p), u)
    },
    updateUsername: (u) => {
      if (token) persistSession(token, u)
    },
    signOut: () => {
      if (token) void logoutRequest(token).catch(() => {})
      clearSession()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
