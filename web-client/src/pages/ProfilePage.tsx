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
import { usePressPulse } from '../usePressPulse'

type UserProfile = components['schemas']['UserProfile']
type UserProfileUpdate = components['schemas']['UserProfileUpdate']

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

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

export function ProfilePage() {
  const { username, token, signOut, updateUsername } = useAuth()
  const navigate = useNavigate()

  const [prefsBtnRef, pulsePrefs] = usePressPulse<HTMLButtonElement>()
  const [usernameBtnRef, pulseUsername] = usePressPulse<HTMLButtonElement>()
  const [passwordBtnRef, pulsePassword] = usePressPulse<HTMLButtonElement>()

  const [usernameDraft, setUsernameDraft] = useState<string | null>(null)
  const newUsername = usernameDraft ?? username ?? ''
  const [newPassword, setNewPassword] = useState('')
  const [repeatNewPassword, setRepeatNewPassword] = useState('')
  const [aboutMe, setAboutMe] = useState<string[]>([])
  const [diet, setDiet] = useState('')
  const [allergies, setAllergies] = useState<string[]>(['', ''])

  const [prefsStatus, setPrefsStatus] = useState<{ kind: 'error' | 'ok'; msg: string } | null>(null)
  const [usernameStatus, setUsernameStatus] = useState<{ kind: 'error' | 'ok'; msg: string } | null>(null)
  const [passwordStatus, setPasswordStatus] = useState<{ kind: 'error' | 'ok'; msg: string } | null>(null)
  const [prefsSaving, setPrefsSaving] = useState(false)
  const [usernameSaving, setUsernameSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)

	// fetch the currently stored user profile
  useEffect(() => {
    if (!token) return
    let cancelled = false
    fetch(`${API_BASE}/api/v1/users/profile`, {
      headers: { authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.status === 403 || res.status === 401) {
          signOut()
          navigate('/login')
          return
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as UserProfile
        if (cancelled) return
        const prefs = data.preferences ?? {}
        setAboutMe(prefs.aboutMe ?? [])
        setDiet(prefs.diet ?? '')
        setAllergies(prefs.allergies?.length ? prefs.allergies : ['', ''])
      })
      .catch((e) => {
        if (!cancelled) setPrefsStatus({ kind: 'error', msg: e instanceof Error ? e.message : String(e) })
      })
    return () => {
      cancelled = true
    }
  }, [token, signOut, navigate])

  async function updateProfile(body: UserProfileUpdate): Promise<void> {
    const res = await fetch(`${API_BASE}/api/v1/users/profile`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })
    if (res.status === 403 || res.status === 401) {
      signOut()
      navigate('/login')
      throw new Error('Session expired')
    }
    if (res.status === 409) throw new Error('Username already taken')
    if (res.status === 400) throw new Error('Invalid request')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  }

  async function handleSavePreferences() {
    pulsePrefs()
    setPrefsSaving(true)
    setPrefsStatus(null)
    try {
      await updateProfile({
        preferences: {
          diet,
          allergies: allergies.map((a) => a.trim()).filter((a) => a !== ''),
          aboutMe: aboutMe.map((a) => a.trim()).filter((a) => a !== ''),
        },
      })
      setPrefsStatus({ kind: 'ok', msg: 'Preferences saved' })
    } catch (e) {
      setPrefsStatus({ kind: 'error', msg: e instanceof Error ? e.message : String(e) })
    } finally {
      setPrefsSaving(false)
    }
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
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            handleSavePreferences()
          }}
        >
          <h2 className="text-lg font-bold">Taste preferences</h2>

          <label className="flex flex-col gap-1">
            <span className="font-medium">About me</span>
            <textarea
              className="w-full border border-gray-300 rounded p-2"
              rows={3}
              value={aboutMe[0] ?? ''}
              onChange={(e) => setAboutMe([e.target.value])}
              placeholder="e.g. I cook for a family of four and love spicy food"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-medium">Diet</span>
            <input
              type="text"
              className="w-full border border-gray-300 rounded p-2"
              value={diet}
              onChange={(e) => setDiet(e.target.value)}
              placeholder="e.g. vegetarian"
            />
          </label>

          <div className="flex flex-col gap-1">
            <span className="font-medium">Allergies</span>
            {allergies.map((allergy, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded p-2"
                  value={allergy}
                  onChange={(e) =>
                    setAllergies(allergies.map((a, j) => (j === i ? e.target.value : a)))
                  }
                  placeholder={allergyPlaceholders[i % allergyPlaceholders.length]}
                />
                <button
                  type="button"
                  className="cursor-pointer text-gray-400 hover:text-red-600 transition-transform duration-100 hover:scale-98"
                  onClick={() => setAllergies(allergies.filter((_, j) => j !== i))}
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

          <Button ref={prefsBtnRef} type="submit" className="self-center" disabled={prefsSaving}>
            {prefsSaving ? 'Saving…' : 'Update taste preferences'}
          </Button>

          {prefsStatus && (
            <p className={prefsStatus.kind === 'error' ? 'text-red-600' : 'text-green-600'}>
              {prefsStatus.msg}
            </p>
          )}
        </form>
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
