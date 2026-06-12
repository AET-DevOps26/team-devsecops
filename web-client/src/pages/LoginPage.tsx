import { useState } from 'react'
import type { SubmitEventHandler } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth'
import { Button } from '../components/Button'
import { PasswordInput } from '../components/PasswordInput'
import { usePressPulse } from '../usePressPulse'

type Tab = 'login' | 'register'

export function LoginPage() {
	const { t } = useTranslation()
	const [tab, setTab] = useState<Tab>('login')
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [repeatPassword, setRepeatPassword] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)
	const { token, signIn, register } = useAuth()
	const [submitRef, pulseSubmit] = usePressPulse<HTMLButtonElement>()

	const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (e) => {
		e.preventDefault()
		pulseSubmit()
		if (tab === 'register' && password !== repeatPassword) {
			setError(t('login.passwordsNoMatch'))
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

	const passwordMismatch = error === t('login.passwordsNoMatch')
	const inputClass = (invalid: boolean) =>
		`w-full border rounded p-2 ${invalid ? 'border-red-500' : 'border-gray-300'}`

	// already signed in -> skip the login page
	if (token) return <Navigate to="/generate" replace />

	return (
		<main className="mx-auto flex max-w-2xl flex-col gap-4 p-6 animate-fade-in">
			<h1 className="text-2xl font-bold">{t('layout.generate')}</h1>
			<div className="relative inline-flex self-start rounded-lg bg-gray-100 p-1">
				<span
					className={`pointer-events-none absolute inset-y-1 left-1 w-24 rounded-md bg-white shadow-sm transition-transform duration-200 ease-out ${
						tab === 'register' ? 'translate-x-full' : 'translate-x-0'
					}`}
				/>
				{(['login', 'register'] as const).map((value) => (
					<button
						key={value}
						type="button"
						className={`relative z-10 w-24 rounded-md py-1 text-sm font-medium transition-colors ${
							tab === value ? 'text-orange-600' : 'text-gray-500'
						}`}
						onClick={() => {
							setTab(value)
							setError('')
						}}
					>
						{value === 'login' ? t('login.login') : t('login.register')}
					</button>
				))}
			</div>

			<form className="flex flex-col gap-4 max-w-sm" onSubmit={handleSubmit}>
				<label className="flex flex-col gap-1">
					<span className="font-medium">{t('login.username')}</span>
					<input
						type="text"
						className={inputClass(!!error && !passwordMismatch)}
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						autoComplete="username"
					/>
				</label>

				<label className="flex flex-col gap-1">
					<span className="font-medium">{t('login.password')}</span>
					<PasswordInput
						className={inputClass(!!error)}
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
					/>
				</label>

				{tab === 'register' && (
					<label className="flex flex-col gap-1">
						<span className="font-medium">{t('login.repeatPassword')}</span>
						<PasswordInput
							className={inputClass(passwordMismatch)}
							value={repeatPassword}
							onChange={(e) => setRepeatPassword(e.target.value)}
							autoComplete="new-password"
						/>
					</label>
				)}

				<Button ref={submitRef} type="submit" className="self-start" disabled={loading}>
					{loading ? t('login.pleaseWait') : tab === 'login' ? t('login.login') : t('login.signup')}
				</Button>

				{error && <p className="text-red-600">{error}</p>}
			</form>
		</main>
	)
}
