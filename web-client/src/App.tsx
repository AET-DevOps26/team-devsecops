import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth'
import { AppLayout } from './components/AppLayout'
import { GenerateFlow, GeneratePage, GenerateResultsPage } from './pages/GeneratePage'
import { LibraryPage } from './pages/LibraryPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProfilePage } from './pages/ProfilePage'
import { RecipePage } from './pages/RecipePage'

function RequireAuth({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<Navigate to="/generate" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route path="/generate" element={<GenerateFlow />}>
              <Route index element={<GeneratePage />} />
              <Route path="results" element={<GenerateResultsPage />} />
              <Route path="recipe" element={<RecipePage />} />
            </Route>
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/library/recipe/:recipeId" element={<RecipePage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
