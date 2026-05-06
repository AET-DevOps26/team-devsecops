import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="mx-auto max-w-2xl p-6 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">404 — Page not found</h1>
      <Link to="/" className="text-orange-600 underline self-start">
        Go back home
      </Link>
    </main>
  )
}
