import { useState } from 'react'
import type { SubmitEventHandler } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { Button } from '../components/Button'

type Tab = 'login' | 'register'

export function LoginPage() {
  const [tab, setTab] = useState<Tab>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { token, signIn, register } = useAuth()

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    if (tab === 'register' && password !== repeatPassword) {
      setError('Passwords do not match')
      return
    }
    setError('')
    setLoading(true)
    try {
      if (tab === 'login') await signIn(username, password)
      else await register(username, password)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const passwordMismatch = error === 'Passwords do not match'
  const inputClass = (invalid: boolean) =>
    `w-full border rounded p-2 ${invalid ? 'border-red-500' : 'border-gray-300'}`

  // already signed in -> skip the login page
  if (token) return <Navigate to="/profile" replace />

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Cooking Assistant</h1>
      <div className="relative inline-flex self-start rounded-lg bg-gray-100 p-1">
        <span
          className={`pointer-events-none absolute inset-y-1 left-1 w-24 rounded-md bg-white shadow-sm transition-transform duration-200 ease-out ${
            tab === 'register' ? 'translate-x-full' : 'translate-x-0'
          }`}
        />
        {(['login', 'register'] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={`relative z-10 w-24 rounded-md py-1 text-sm font-medium transition-colors ${
              tab === t ? 'text-orange-600' : 'text-gray-500'
            }`}
            onClick={() => {
              setTab(t)
              setError('')
            }}
          >
            {t === 'login' ? 'Login' : 'Register'}
          </button>
        ))}
      </div>

      <form className="flex flex-col gap-4 max-w-sm" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1">
          <span className="font-medium">Username</span>
          <input
            type="text"
            className={inputClass(!!error && !passwordMismatch)}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-medium">Password</span>
          <input
            type="password"
            className={inputClass(!!error)}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
          />
        </label>

        {tab === 'register' && (
          <label className="flex flex-col gap-1">
            <span className="font-medium">Repeat password</span>
            <input
              type="password"
              className={inputClass(passwordMismatch)}
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>
        )}

        <Button type="submit" className="self-start" disabled={loading}>
          {loading ? 'Please wait…' : tab === 'login' ? 'Login' : 'Sign up'}
        </Button>

        {error && <p className="text-red-600">{error}</p>}
      </form>
    </main>
  )
}
