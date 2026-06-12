import { useCallback } from 'react'
import { useAuth } from './auth'

const API_BASE = (import.meta.env.VITE_API_BASE ?? '') + '/api/v1'

export class SessionExpiredError extends Error {
	constructor() {
		super('Session expired')
		this.name = 'SessionExpiredError'
	}
}

export function useApi() {
	const { token, signOut } = useAuth()
	return useCallback(
		async (path: string, init: RequestInit = {}): Promise<Response> => {
			const headers = new Headers(init.headers)
			if (token) headers.set('authorization', `Bearer ${token}`)
			const res = await fetch(`${API_BASE}${path}`, { ...init, headers })
			if (res.status === 401 || res.status === 403) {
				signOut()
				throw new SessionExpiredError()
			}
			return res
		},
		[token, signOut],
	)
}
