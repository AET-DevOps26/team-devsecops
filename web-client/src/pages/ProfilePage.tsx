import { useEffect, useState } from 'react'
import {
	ArrowRightStartOnRectangleIcon,
	PlusIcon,
	TrashIcon,
} from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import type { components } from '../api'
import { useAuth } from '../auth'
import { Button } from '../components/Button'
import { PasswordInput } from '../components/PasswordInput'
import { SaveIndicator, type SaveStatus } from '../components/SaveIndicator'
import { usePressPulse } from '../usePressPulse'
import { usePrefsAutosave } from '../usePrefsAutosave'
import { errorMessage } from '../apiError'
import { SessionExpiredError, useApi } from '../useApi'
import { detectInitialLanguage } from '../i18n'

type UserProfile = components['schemas']['UserProfile']
type UserProfileUpdate = components['schemas']['UserProfileUpdate']

type Language = NonNullable<components['schemas']['UserPreferences']['language']>

type LanguageSetting = Language | 'detect'

const LANGUAGE_OPTIONS = [
	{ code: 'detect', labelKey: 'profile.detectLanguage' },
	{ code: 'EN', labelKey: 'profile.english' },
	{ code: 'DE', labelKey: 'profile.german' },
	{ code: 'HU', labelKey: 'profile.hungarian' },
] as const satisfies readonly { code: LanguageSetting; labelKey: string }[]

// un-trimmed preferences as held by the inputs
type PrefsDraft = { language: LanguageSetting; aboutMe: string[]; diet: string[]; allergies: string[] }

const trimList = (xs: string[]) => xs.map((x) => x.trim()).filter((x) => x !== '')

const arrayWithout = (array: string[], index: number | null) =>
	index === null ? array : array.filter((_, i) => i !== index)

const SAVE_TIMEOUT_MS = 8000

// when a field spans several inputs (e.g. each diet row), the worst-case status wins
const STATUS_PRIORITY: SaveStatus[] = ['error', 'saving', 'resaving', 'saved', 'idle']

export function ProfilePage() {
	const { t, i18n } = useTranslation()
	const { username, signOut, updateUsername } = useAuth()
	const apiFetch = useApi()
	const navigate = useNavigate()

	const [usernameBtnRef, pulseUsername] = usePressPulse<HTMLButtonElement>()
	const [passwordBtnRef, pulsePassword] = usePressPulse<HTMLButtonElement>()

	const [usernameDraft, setUsernameDraft] = useState<string | null>(null)
	const newUsername = usernameDraft ?? username ?? ''
	const [newPassword, setNewPassword] = useState('')
	const [repeatNewPassword, setRepeatNewPassword] = useState('')
	const [language, setLanguage] = useState<LanguageSetting>('detect')
	const [aboutMe, setAboutMe] = useState<string[]>([])
	const [diet, setDiet] = useState<string[]>([''])
	const [allergies, setAllergies] = useState<string[]>(['', ''])
	const [pendingDietDeletion, setPendingDietDeletion] = useState<number | null>(null)
	const [pendingAllergyDeletion, setPendingAllergyDeletion] = useState<number | null>(null)

	const [prefsStatus, setPrefsStatus] = useState<{ kind: 'error' | 'ok'; msg: string } | null>(null)
	const [usernameStatus, setUsernameStatus] = useState<{ kind: 'error' | 'ok'; msg: string } | null>(null)
	const [passwordStatus, setPasswordStatus] = useState<{ kind: 'error' | 'ok'; msg: string } | null>(null)
	const [usernameSaving, setUsernameSaving] = useState(false)
	const [passwordSaving, setPasswordSaving] = useState(false)
	const [confirmingDelete, setConfirmingDelete] = useState(false)
	const [deleting, setDeleting] = useState(false)
	const [deleteStatus, setDeleteStatus] = useState<{ kind: 'error'; msg: string } | null>(null)

	// fetch the currently stored user profile
	useEffect(() => {
		let cancelled = false
		apiFetch('/users/profile')
			.then(async (res) => {
				if (!res.ok) throw new Error(await errorMessage(res))
				const data = (await res.json()) as UserProfile
				if (cancelled) return
				const prefs = data.preferences ?? {}
				setLanguage(prefs.language ?? 'detect')
				setAboutMe(prefs.aboutMe ?? [])
				setDiet(prefs.diet?.length ? prefs.diet : [''])
				setAllergies(prefs.allergies?.length ? prefs.allergies : ['', ''])
			})
			.catch((e) => {
				if (cancelled || e instanceof SessionExpiredError) return
				setPrefsStatus({ kind: 'error', msg: e instanceof Error ? e.message : String(e) })
			})
		return () => {
			cancelled = true
		}
	}, [apiFetch])

	async function updateProfile(body: UserProfileUpdate, keepalive = false): Promise<void> {
		let res: Response
		try {
			res = await apiFetch('/users/profile', {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(body),
				// keepalive lets a save fired on reload/close outlive the page
				...(keepalive ? { keepalive: true } : { signal: AbortSignal.timeout(SAVE_TIMEOUT_MS) }),
			})
		} catch (e) {
			if ((e instanceof DOMException && e.name === 'TimeoutError') || e instanceof TypeError) {
				throw new Error(t('profile.couldntReachServer'), { cause: e })
			}
			throw e
		}
		if (res.status === 409) throw new Error(await errorMessage(res, t('profile.usernameTaken')))
		if (res.status === 400) throw new Error(await errorMessage(res, t('profile.invalidRequest')))
		if (!res.ok) throw new Error(await errorMessage(res, `HTTP ${res.status}`))
	}

	const savePrefs = (draft: PrefsDraft, keepalive = false) =>
		updateProfile(
			{
				preferences: {
					language: draft.language === 'detect' ? undefined : draft.language,
					diet: trimList(draft.diet),
					allergies: trimList(draft.allergies),
					aboutMe: trimList(draft.aboutMe),
				},
			},
			keepalive,
		)

	const { statuses: prefsStatuses, notifyEdit, trackSave } = usePrefsAutosave<PrefsDraft>({
		save: savePrefs,
		onError: (err) => {
			if (err instanceof SessionExpiredError) return
			setPrefsStatus({ kind: 'error', msg: err instanceof Error ? err.message : String(err) })
		},
	})

	// aggregate the status of every input belonging to a field (e.g. all diet rows)
	const groupStatus = (field: string): SaveStatus => {
		const statuses = Object.entries(prefsStatuses)
			.filter(([key]) => key === field || key.startsWith(`${field}:`))
			.map(([, status]) => status)
		return STATUS_PRIORITY.find((s) => statuses.includes(s)) ?? 'idle'
	}

	// preferences without those that are currently being delted
	const livePrefs = (overrides: Partial<PrefsDraft> = {}): PrefsDraft => ({
		language: overrides.language ?? language,
		aboutMe: overrides.aboutMe ?? aboutMe,
		diet: arrayWithout(overrides.diet ?? diet, pendingDietDeletion),
		allergies: arrayWithout(overrides.allergies ?? allergies, pendingAllergyDeletion),
	})

	function editPrefs(field: string, draft: PrefsDraft) {
		setPrefsStatus(null)
		notifyEdit(field, draft)
	}

	async function deleteRow(list: 'diet' | 'allergies', index: number) {
		const setPending = list === 'diet' ? setPendingDietDeletion : setPendingAllergyDeletion
		const setValues = list === 'diet' ? setDiet : setAllergies

		setPending(index)
		setPrefsStatus(null)
		try {
			await trackSave(list, () =>
				savePrefs(
					livePrefs(
						list === 'diet'
							? { diet: arrayWithout(diet, index) }
							: { allergies: arrayWithout(allergies, index) },
					),
				),
			)
			setValues((cur) => cur.filter((_, i) => i !== index))
			setPending(null)
		} catch (e) {
			setPending(null)
			if (e instanceof SessionExpiredError) return
			setPrefsStatus({ kind: 'error', msg: e instanceof Error ? e.message : String(e) })
		}
	}

	async function handleUpdateUsername() {
		pulseUsername()
		const trimmedUsername = newUsername.trim()
		if (trimmedUsername === '' || trimmedUsername === username) {
			setUsernameStatus({ kind: 'error', msg: t('profile.enterNewUsername') })
			return
		}

		setUsernameSaving(true)
		setUsernameStatus(null)
		try {
			await updateProfile({ username: trimmedUsername })
			updateUsername(trimmedUsername)
			setUsernameDraft(null)
			setUsernameStatus({ kind: 'ok', msg: t('profile.usernameUpdated') })
		} catch (e) {
			if (e instanceof SessionExpiredError) return
			setUsernameStatus({ kind: 'error', msg: e instanceof Error ? e.message : String(e) })
		} finally {
			setUsernameSaving(false)
		}
	}

	async function handleUpdatePassword() {
		pulsePassword()
		if (!newPassword) {
			setPasswordStatus({ kind: 'error', msg: t('profile.enterNewPassword') })
			return
		}
		if (newPassword !== repeatNewPassword) {
			setPasswordStatus({ kind: 'error', msg: t('profile.passwordsNoMatch') })
			return
		}

		setPasswordSaving(true)
		setPasswordStatus(null)
		try {
			await updateProfile({ password: newPassword })
			setNewPassword('')
			setRepeatNewPassword('')
			setPasswordStatus({ kind: 'ok', msg: t('profile.passwordUpdated') })
		} catch (e) {
			if (e instanceof SessionExpiredError) return
			setPasswordStatus({ kind: 'error', msg: e instanceof Error ? e.message : String(e) })
		} finally {
			setPasswordSaving(false)
		}
	}

	async function handleDeleteAccount() {
		setDeleting(true)
		setDeleteStatus(null)
		try {
			const res = await apiFetch('/users/profile', { method: 'DELETE' })
			if (!res.ok) throw new Error(await errorMessage(res))
			signOut()
			navigate('/login')
		} catch (e) {
			setDeleting(false)
			setDeleteStatus({ kind: 'error', msg: e instanceof Error ? e.message : String(e) })
		}
	}

	const dietPlaceholders = t('profile.dietPlaceholders', { returnObjects: true })
	const allergyPlaceholders = t('profile.allergyPlaceholders', { returnObjects: true })

	return (
		<>
			<div className="flex flex-col items-center gap-1 w-full max-w-md self-center md:self-start my-12">
				<p>
					<Trans i18nKey="profile.signedInAs" values={{ username: username ?? '' }}>
            Signed in as <span className="font-medium">{username}</span>.
					</Trans>
				</p>
				<button
					type="button"
					className="flex items-center gap-1 self-center text-red-600 cursor-pointer transition-transform duration-100 hover:scale-98"
					onClick={() => {
						signOut()
						navigate('/login')
					}}
				>
					<ArrowRightStartOnRectangleIcon className="h-5 w-5" />
					{t('profile.logout')}
				</button>
			</div>

			{/* Preferences */}
			<div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm self-center md:self-start">
				<div className="flex flex-col gap-4">
					<h2 className="text-lg font-bold">{t('profile.preferences')}</h2>

					{/* Language */}
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-2">
							<span className="font-medium">{t('profile.language')}</span>
							<SaveIndicator status={prefsStatuses['language'] ?? 'idle'} />
						</div>
						<div className="relative inline-flex self-start rounded-lg bg-gray-100 p-1">
							<span
								className="pointer-events-none absolute inset-y-1 left-1 w-24 rounded-md bg-white shadow-sm transition-transform duration-200 ease-out"
								style={{
									transform: `translateX(${LANGUAGE_OPTIONS.findIndex((o) => o.code === language) * 100}%)`,
								}}
							/>
							{LANGUAGE_OPTIONS.map(({ code, labelKey }) => (
								<button
									key={code}
									type="button"
									aria-pressed={language === code}
									className={`relative z-10 w-24 rounded-md py-1 text-sm font-medium transition-colors ${
										language === code ? 'text-orange-600' : 'text-gray-500'
									}`}
									onClick={() => {
										setLanguage(code)
										void i18n.changeLanguage(code === 'detect' ? detectInitialLanguage() : code)
										editPrefs('language', livePrefs({ language: code }))
									}}
								>
									{t(labelKey)}
								</button>
							))}
						</div>
					</div>

					{/* About me */}
					<label className="flex flex-col gap-1">
						<div className="flex items-center gap-2">
							<span className="font-medium">{t('profile.aboutMe')}</span>
							<SaveIndicator status={prefsStatuses['aboutMe'] ?? 'idle'} />
						</div>
						<textarea
							className="w-full border border-gray-300 rounded p-2"
							rows={3}
							value={aboutMe[0] ?? ''}
							onChange={(e) => {
								const next = [e.target.value]
								setAboutMe(next)
								editPrefs('aboutMe', livePrefs({ aboutMe: next }))
							}}
							placeholder={t('profile.aboutMePlaceholder')}
						/>
					</label>

					{/* Diets */}
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-2">
							<span className="font-medium">{t('profile.diet')}</span>
							<SaveIndicator status={groupStatus('diet')} />
						</div>
						{diet.map((d, i) => (
							<div
								key={i}
								className={`flex items-center gap-2 ${pendingDietDeletion === i ? 'opacity-50' : ''}`}
							>
								<input
									type="text"
									className="flex-1 border border-gray-300 rounded p-2 disabled:bg-gray-100"
									value={d}
									disabled={pendingDietDeletion === i}
									onChange={(e) => {
										const next = diet.map((x, j) => (j === i ? e.target.value : x))
										setDiet(next)
										editPrefs(`diet:${i}`, livePrefs({ diet: next }))
									}}
									placeholder={dietPlaceholders[i % dietPlaceholders.length]}
								/>
								<button
									type="button"
									className="cursor-pointer text-gray-400 hover:text-red-600 transition-transform duration-100 hover:scale-98 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:text-gray-300 disabled:hover:scale-100"
									disabled={pendingDietDeletion !== null}
									onClick={() => deleteRow('diet', i)}
								>
									<TrashIcon className="h-5 w-5" />
								</button>
							</div>
						))}
						<button
							type="button"
							className="flex items-center gap-2 self-center mt-1 cursor-pointer text-gray-500 transition-transform duration-100 hover:scale-98"
							onClick={() => setDiet([...diet, ''])}
						>
							<span className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-400">
								<PlusIcon className="h-4 w-4 text-gray-400 stroke-2" />
							</span>
							{t('profile.addDiet')}
						</button>
					</div>

					{/* Allergies */}
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-2">
							<span className="font-medium">{t('profile.allergies')}</span>
							<SaveIndicator status={groupStatus('allergies')} />
						</div>
						{allergies.map((allergy, i) => (
							<div
								key={i}
								className={`flex items-center gap-2 ${pendingAllergyDeletion === i ? 'opacity-50' : ''}`}
							>
								<input
									type="text"
									className="flex-1 border border-gray-300 rounded p-2 disabled:bg-gray-100"
									value={allergy}
									disabled={pendingAllergyDeletion === i}
									onChange={(e) => {
										const next = allergies.map((a, j) => (j === i ? e.target.value : a))
										setAllergies(next)
										editPrefs(`allergies:${i}`, livePrefs({ allergies: next }))
									}}
									placeholder={allergyPlaceholders[i % allergyPlaceholders.length]}
								/>
								<button
									type="button"
									className="cursor-pointer text-gray-400 hover:text-red-600 transition-transform duration-100 hover:scale-98 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:text-gray-300 disabled:hover:scale-100"
									disabled={pendingAllergyDeletion !== null}
									onClick={() => deleteRow('allergies', i)}
								>
									<TrashIcon className="h-5 w-5" />
								</button>
							</div>
						))}
						<button
							type="button"
							className="flex items-center gap-2 self-center mt-1 cursor-pointer text-gray-500 transition-transform duration-100 hover:scale-98"
							onClick={() => setAllergies([...allergies, ''])}
						>
							<span className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-400">
								<PlusIcon className="h-4 w-4 text-gray-400 stroke-2" />
							</span>
							{t('profile.addAllergy')}
						</button>
					</div>

					{prefsStatus && (
						<p className={prefsStatus.kind === 'error' ? 'text-red-600' : 'text-green-600'}>
							{prefsStatus.msg}
						</p>
					)}
				</div>
			</div>

			{/* Update username */}
			<div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm self-center md:self-start">
				<form
					className="flex flex-col gap-4"
					onSubmit={(e) => {
						e.preventDefault()
						handleUpdateUsername()
					}}
				>
					<h2 className="text-lg font-bold">{t('profile.updateUsername')}</h2>

					<label className="flex flex-col gap-1">
						<span className="font-medium">{t('profile.newUsername')}</span>
						<input
							type="text"
							className="w-full border border-gray-300 rounded p-2"
							value={newUsername}
							onChange={(e) => setUsernameDraft(e.target.value)}
							autoComplete="username"
						/>
					</label>

					<Button ref={usernameBtnRef} type="submit" className="self-center" disabled={usernameSaving}>
						{usernameSaving ? t('profile.saving') : t('profile.updateUsername')}
					</Button>

					{usernameStatus && (
						<p className={usernameStatus.kind === 'error' ? 'text-red-600' : 'text-green-600'}>
							{usernameStatus.msg}
						</p>
					)}
				</form>
			</div>

			{/* Update password */}
			<div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm self-center md:self-start">
				<form
					className="flex flex-col gap-4"
					onSubmit={(e) => {
						e.preventDefault()
						handleUpdatePassword()
					}}
				>
					<h2 className="text-lg font-bold">{t('profile.updatePassword')}</h2>

					<label className="flex flex-col gap-1">
						<span className="font-medium">{t('profile.newPassword')}</span>
						<PasswordInput
							className="w-full border border-gray-300 rounded p-2"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							autoComplete="new-password"
						/>
					</label>

					<label className="flex flex-col gap-1">
						<span className="font-medium">{t('profile.repeatNewPassword')}</span>
						<PasswordInput
							className="w-full border border-gray-300 rounded p-2"
							value={repeatNewPassword}
							onChange={(e) => setRepeatNewPassword(e.target.value)}
							autoComplete="new-password"
						/>
					</label>

					<Button ref={passwordBtnRef} type="submit" className="self-center" disabled={passwordSaving}>
						{passwordSaving ? t('profile.saving') : t('profile.updatePassword')}
					</Button>

					{passwordStatus && (
						<p className={passwordStatus.kind === 'error' ? 'text-red-600' : 'text-green-600'}>
							{passwordStatus.msg}
						</p>
					)}
				</form>
			</div>

			{/* Delete account */}
			<div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm self-center md:self-start">
				<div className="flex flex-col gap-4">
					<h2 className="text-lg font-bold">{t('profile.deleteAccount')}</h2>

					{confirmingDelete ? (
						<>
							<p className="text-red-600">{t('profile.deleteAccountWarning')}</p>
							<div className="flex items-center justify-center gap-4">
								<button
									type="button"
									className="cursor-pointer text-gray-500 transition-transform duration-100 hover:scale-98 disabled:cursor-not-allowed disabled:opacity-50"
									disabled={deleting}
									onClick={() => setConfirmingDelete(false)}
								>
									{t('profile.deleteAccountCancel')}
								</button>
								<button
									type="button"
									className="flex items-center gap-1 cursor-pointer text-red-600 transition-transform duration-100 hover:scale-98 disabled:cursor-not-allowed disabled:opacity-50"
									disabled={deleting}
									onClick={handleDeleteAccount}
								>
									<TrashIcon className="h-5 w-5" />
									{deleting ? t('profile.deleting') : t('profile.deleteAccountConfirm')}
								</button>
							</div>
						</>
					) : (
						<button
							type="button"
							className="flex items-center gap-1 self-center text-red-600 cursor-pointer transition-transform duration-100 hover:scale-98"
							onClick={() => {
								setDeleteStatus(null)
								setConfirmingDelete(true)
							}}
						>
							<TrashIcon className="h-5 w-5" />
							{t('profile.deleteAccount')}
						</button>
					)}

					{deleteStatus && <p className="text-red-600">{deleteStatus.msg}</p>}
				</div>
			</div>
		</>
	)
}
