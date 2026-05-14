import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

const TOKEN_KEY = 'auth_token'

// TODO: replace mock implementation with real server call

async function signInRequest(username: string, password: string): Promise<string> {
  if (!username.trim() || !password) throw new Error('Enter a username and password')
  if (password !== 'test') throw new Error('Invalid credentials')
  return `mock-token-for-${username}`
}

async function registerRequest(username: string, password: string): Promise<string> {
  if (!username.trim() || !password) throw new Error('Enter a username and password')
  return `mock-token-for-${username}`
}

type AuthContextValue = {
  token: string | null
  signIn: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))

  function persist(newToken: string) {
    localStorage.setItem(TOKEN_KEY, newToken)
    setToken(newToken)
  }

  const value: AuthContextValue = {
    token,
    signIn: async (username, password) => persist(await signInRequest(username, password)),
    register: async (username, password) => persist(await registerRequest(username, password)),
    signOut: () => {
      localStorage.removeItem(TOKEN_KEY)
      setToken(null)
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
