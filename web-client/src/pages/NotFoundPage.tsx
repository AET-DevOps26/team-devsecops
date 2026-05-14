import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">404 — Page not found</h1>
      <Link to="/" className="text-orange-600 underline self-start">
        Go back home
      </Link>
    </main>
  )
}
