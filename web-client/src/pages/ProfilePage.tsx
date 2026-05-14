import { useState } from 'react'
import {
  ArrowRightStartOnRectangleIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { Button } from '../components/Button'
import { PasswordInput } from '../components/PasswordInput'

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
  const { username, signOut } = useAuth()
  const navigate = useNavigate()

  const [newPassword, setNewPassword] = useState('')
  const [repeatNewPassword, setRepeatNewPassword] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [aboutMe, setAboutMe] = useState<string[]>([])
  const [diet, setDiet] = useState('')
  const [allergies, setAllergies] = useState<string[]>(['', ''])

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
          onSubmit={(e) => e.preventDefault()}
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

          <Button type="submit" className="self-center">
            Update taste preferences
          </Button>
        </form>
      </div>

      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm self-center md:self-start">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => e.preventDefault()}
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

          <Button type="submit" className="self-center">
            Update password
          </Button>
        </form>
      </div>

      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm self-center md:self-start">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => e.preventDefault()}
        >
          <h2 className="text-lg font-bold">Delete account</h2>

          <label className="flex flex-col gap-1">
            <span className="font-medium">Password</span>
            <PasswordInput
              className="w-full border border-gray-300 rounded p-2"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          <button
            type="button"
            className="flex items-center gap-1 self-center text-red-600 cursor-pointer transition-transform duration-100 hover:scale-98"
          >
            <TrashIcon className="h-5 w-5" />
            Delete account
          </button>
        </form>
      </div>
    </>
  )
}
