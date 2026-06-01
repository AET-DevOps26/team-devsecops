import { useEffect, useState } from 'react'
import {
  ArrowRightStartOnRectangleIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import type { components } from '../api'
import { useAuth } from '../auth'
import { Button } from '../components/Button'
import { PasswordInput } from '../components/PasswordInput'
import { SaveIndicator } from '../components/SaveIndicator'
import { usePressPulse } from '../usePressPulse'
import { usePrefsAutosave } from '../usePrefsAutosave'
import { errorMessage } from '../apiError'
import { SessionExpiredError, useApi } from '../useApi'

type UserProfile = components['schemas']['UserProfile']
type UserProfileUpdate = components['schemas']['UserProfileUpdate']

// raw (un-trimmed) preferences as held by the inputs
type PrefsDraft = { aboutMe: string[]; diet: string[]; allergies: string[] }

const trimList = (xs: string[]) => xs.map((x) => x.trim()).filter((x) => x !== '')

// Abort a profile save that the server never answers, so the indicator can't
// stay stuck on the spinner forever.
const SAVE_TIMEOUT_MS = 8000

const allergyPlaceholders = [
  'e.g. peanuts',
  'e.g. shellfish',
  'e.g. gluten',
  'e.g. eggs',
  'e.g. tree nuts',
  'e.g. dairy',
  'e.g. soy',
  'e.g. sesame',
]

const dietPlaceholders = [
  'e.g. vegetarian',
  'e.g. keto',
  'e.g. pescatarian',
  'e.g. low-carb',
]

export function ProfilePage() {
  const { username, signOut, updateUsername } = useAuth()
  const apiFetch = useApi()
  const navigate = useNavigate()

  const [usernameBtnRef, pulseUsername] = usePressPulse<HTMLButtonElement>()
  const [passwordBtnRef, pulsePassword] = usePressPulse<HTMLButtonElement>()

  const [usernameDraft, setUsernameDraft] = useState<string | null>(null)
  const newUsername = usernameDraft ?? username ?? ''
  const [newPassword, setNewPassword] = useState('')
  const [repeatNewPassword, setRepeatNewPassword] = useState('')
  const [aboutMe, setAboutMe] = useState<string[]>([])
  const [diet, setDiet] = useState<string[]>([''])
  const [allergies, setAllergies] = useState<string[]>(['', ''])

  const [prefsStatus, setPrefsStatus] = useState<{ kind: 'error' | 'ok'; msg: string } | null>(null)
  const [usernameStatus, setUsernameStatus] = useState<{ kind: 'error' | 'ok'; msg: string } | null>(null)
  const [passwordStatus, setPasswordStatus] = useState<{ kind: 'error' | 'ok'; msg: string } | null>(null)
  const [usernameSaving, setUsernameSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)

	// fetch the currently stored user profile
  useEffect(() => {
    let cancelled = false
    apiFetch('/api/v1/users/profile')
      .then(async (res) => {
        if (!res.ok) throw new Error(await errorMessage(res, `HTTP ${res.status}`))
        const data = (await res.json()) as UserProfile
        if (cancelled) return
        const prefs = data.preferences ?? {}
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

  async function updateProfile(body: UserProfileUpdate): Promise<void> {
    let res: Response
    try {
      res = await apiFetch('/api/v1/users/profile', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        // Don't let a dead/unreachable server leave the save spinner hanging.
        signal: AbortSignal.timeout(SAVE_TIMEOUT_MS),
      })
    } catch (e) {
      // A timed-out request (DOMException) or a refused/unreachable connection
      // (fetch rejects with a TypeError) both mean: the server isn't there.
      if ((e instanceof DOMException && e.name === 'TimeoutError') || e instanceof TypeError) {
        throw new Error("Couldn't reach the server", { cause: e })
      }
      throw e
    }
    if (res.status === 409) throw new Error(await errorMessage(res, 'Username already taken'))
    if (res.status === 400) throw new Error(await errorMessage(res, 'Invalid request'))
    if (!res.ok) throw new Error(await errorMessage(res, `HTTP ${res.status}`))
  }

  const { statuses: prefsStatuses, notifyEdit } = usePrefsAutosave<PrefsDraft>({
    save: (draft) =>
      updateProfile({
        preferences: {
          diet: trimList(draft.diet),
          allergies: trimList(draft.allergies),
          aboutMe: trimList(draft.aboutMe),
        },
      }),
    onError: (err) => {
      if (err instanceof SessionExpiredError) return
      setPrefsStatus({ kind: 'error', msg: err instanceof Error ? err.message : String(err) })
    },
  })

  // record an edit to one preferences field and (debounced) autosave the lot
  function editPrefs(field: string, draft: PrefsDraft) {
    setPrefsStatus(null)
    notifyEdit(field, draft)
  }

  async function handleUpdateUsername() {
    pulseUsername()
    const trimmedUsername = newUsername.trim()
    if (trimmedUsername === '' || trimmedUsername === username) {
      setUsernameStatus({ kind: 'error', msg: 'Enter a new username' })
      return
    }

    setUsernameSaving(true)
    setUsernameStatus(null)
    try {
      await updateProfile({ username: trimmedUsername })
      updateUsername(trimmedUsername)
      setUsernameDraft(null)
      setUsernameStatus({ kind: 'ok', msg: 'Username updated' })
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
      setPasswordStatus({ kind: 'error', msg: 'Enter a new password' })
      return
    }
    if (newPassword !== repeatNewPassword) {
      setPasswordStatus({ kind: 'error', msg: 'Passwords do not match' })
      return
    }

    setPasswordSaving(true)
    setPasswordStatus(null)
    try {
      await updateProfile({ password: newPassword })
      setNewPassword('')
      setRepeatNewPassword('')
      setPasswordStatus({ kind: 'ok', msg: 'Password updated' })
    } catch (e) {
      if (e instanceof SessionExpiredError) return
      setPasswordStatus({ kind: 'error', msg: e instanceof Error ? e.message : String(e) })
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <>
      <div className="flex flex-col items-center gap-1 w-full max-w-md self-center md:self-start my-12">
        <p>
          Signed in as <span className="font-medium">{username}</span>.
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
          Log out
        </button>
      </div>

      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm self-center md:self-start">
        {/* taste preferences autosave as you type — no submit button */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">Taste preferences</h2>

          <label className="flex flex-col gap-1">
            <span className="font-medium">About me</span>
            <div className="relative">
              <textarea
                className="w-full border border-gray-300 rounded p-2 pr-9"
                rows={3}
                value={aboutMe[0] ?? ''}
                onChange={(e) => {
                  const next = [e.target.value]
                  setAboutMe(next)
                  editPrefs('aboutMe', { aboutMe: next, diet, allergies })
                }}
                placeholder="e.g. I cook for a family of four and love spicy food"
              />
              <SaveIndicator
                status={prefsStatuses['aboutMe'] ?? 'idle'}
                className="absolute right-2 top-2"
              />
            </div>
          </label>

          <div className="flex flex-col gap-1">
            <span className="font-medium">Diet</span>
            {diet.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded p-2 pr-9"
                    value={d}
                    onChange={(e) => {
                      const next = diet.map((x, j) => (j === i ? e.target.value : x))
                      setDiet(next)
                      editPrefs(`diet:${i}`, { aboutMe, diet: next, allergies })
                    }}
                    placeholder={dietPlaceholders[i % dietPlaceholders.length]}
                  />
                  <SaveIndicator
                    status={prefsStatuses[`diet:${i}`] ?? 'idle'}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  />
                </div>
                <button
                  type="button"
                  className="cursor-pointer text-gray-400 hover:text-red-600 transition-transform duration-100 hover:scale-98"
                  onClick={() => {
                    const next = diet.filter((_, j) => j !== i)
                    setDiet(next)
                    editPrefs('diet', { aboutMe, diet: next, allergies })
                  }}
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
              add diet
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-medium">Allergies</span>
            {allergies.map((allergy, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded p-2 pr-9"
                    value={allergy}
                    onChange={(e) => {
                      const next = allergies.map((a, j) => (j === i ? e.target.value : a))
                      setAllergies(next)
                      editPrefs(`allergies:${i}`, { aboutMe, diet, allergies: next })
                    }}
                    placeholder={allergyPlaceholders[i % allergyPlaceholders.length]}
                  />
                  <SaveIndicator
                    status={prefsStatuses[`allergies:${i}`] ?? 'idle'}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  />
                </div>
                <button
                  type="button"
                  className="cursor-pointer text-gray-400 hover:text-red-600 transition-transform duration-100 hover:scale-98"
                  onClick={() => {
                    const next = allergies.filter((_, j) => j !== i)
                    setAllergies(next)
                    editPrefs('allergies', { aboutMe, diet, allergies: next })
                  }}
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
              add allergy
            </button>
          </div>

          {prefsStatus && (
            <p className={prefsStatus.kind === 'error' ? 'text-red-600' : 'text-green-600'}>
              {prefsStatus.msg}
            </p>
          )}
        </div>
      </div>

      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm self-center md:self-start">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            handleUpdateUsername()
          }}
        >
          <h2 className="text-lg font-bold">Update username</h2>

          <label className="flex flex-col gap-1">
            <span className="font-medium">New username</span>
            <input
              type="text"
              className="w-full border border-gray-300 rounded p-2"
              value={newUsername}
              onChange={(e) => setUsernameDraft(e.target.value)}
              autoComplete="username"
            />
          </label>

          <Button ref={usernameBtnRef} type="submit" className="self-center" disabled={usernameSaving}>
            {usernameSaving ? 'Saving…' : 'Update username'}
          </Button>

          {usernameStatus && (
            <p className={usernameStatus.kind === 'error' ? 'text-red-600' : 'text-green-600'}>
              {usernameStatus.msg}
            </p>
          )}
        </form>
      </div>

      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm self-center md:self-start">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            handleUpdatePassword()
          }}
        >
          <h2 className="text-lg font-bold">Update password</h2>

          <label className="flex flex-col gap-1">
            <span className="font-medium">New password</span>
            <PasswordInput
              className="w-full border border-gray-300 rounded p-2"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-medium">Repeat new password</span>
            <PasswordInput
              className="w-full border border-gray-300 rounded p-2"
              value={repeatNewPassword}
              onChange={(e) => setRepeatNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>

          <Button ref={passwordBtnRef} type="submit" className="self-center" disabled={passwordSaving}>
            {passwordSaving ? 'Saving…' : 'Update password'}
          </Button>

          {passwordStatus && (
            <p className={passwordStatus.kind === 'error' ? 'text-red-600' : 'text-green-600'}>
              {passwordStatus.msg}
            </p>
          )}
        </form>
      </div>

			{/* Delete Account (not yet supported by backend) */}
      {/*<div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm self-center md:self-start">*/}
      {/*  <form*/}
      {/*    className="flex flex-col gap-4"*/}
      {/*    onSubmit={(e) => e.preventDefault()}*/}
      {/*  >*/}
      {/*    <h2 className="text-lg font-bold">Delete account</h2>*/}

      {/*    <label className="flex flex-col gap-1">*/}
      {/*      <span className="font-medium">Password</span>*/}
      {/*      <PasswordInput*/}
      {/*        className="w-full border border-gray-300 rounded p-2"*/}
      {/*        value={deletePassword}*/}
      {/*        onChange={(e) => setDeletePassword(e.target.value)}*/}
      {/*        autoComplete="current-password"*/}
      {/*      />*/}
      {/*    </label>*/}

      {/*    <button*/}
      {/*      type="button"*/}
      {/*      className="flex items-center gap-1 self-center text-red-600 cursor-pointer transition-transform duration-100 hover:scale-98"*/}
      {/*    >*/}
      {/*      <TrashIcon className="h-5 w-5" />*/}
      {/*      Delete account*/}
      {/*    </button>*/}
      {/*  </form>*/}
      {/*</div>*/}
    </>
  )
}
