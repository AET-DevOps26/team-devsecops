import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { Button } from '../components/Button'

export function ProfilePage() {
  const { username, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <>
      <p>
        Signed in as <span className="font-medium">{username}</span>
      </p>
      <Button
        type="button"
        className="self-start cursor-pointer"
        onClick={() => {
          signOut()
          navigate('/login')
        }}
      >
        Log out
      </Button>
    </>
  )
}
