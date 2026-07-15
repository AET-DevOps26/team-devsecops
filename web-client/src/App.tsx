import type { ReactNode } from 'react'
import {
	createBrowserRouter,
	createRoutesFromElements,
	RouterProvider,
	Route,
	Navigate,
} from 'react-router-dom'
import { AuthProvider, useAuth } from './auth'
import { AppLayout } from './components/AppLayout'
import { RecipeGenerationProvider } from './recipeGeneration'
import { GenerateFlow, GeneratePage, GenerateResultsPage } from './pages/GeneratePage'
import { LibraryPage } from './pages/LibraryPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProfilePage } from './pages/ProfilePage'
import { RecipePage } from './pages/RecipePage'
import { RecipeEditPage } from './pages/RecipeEditPage'

function RequireAuth({ children }: { children: ReactNode }) {
	const { token } = useAuth()
	return token ? children : <Navigate to="/login" replace />
}

const router = createBrowserRouter(
	createRoutesFromElements(
		<>
			<Route path="/" element={<Navigate to="/generate" replace />} />
			<Route path="/login" element={<LoginPage />} />
			<Route
				element={
					<RequireAuth>
						<RecipeGenerationProvider>
							<AppLayout />
						</RecipeGenerationProvider>
					</RequireAuth>
				}
			>
				<Route path="/generate" element={<GenerateFlow />}>
					<Route index element={<GeneratePage />} />
					<Route path="results" element={<GenerateResultsPage />} />
					<Route path="recipe" element={<RecipePage />} />
					<Route path="recipe/edit" element={<RecipeEditPage />} />
				</Route>
				<Route path="/library" element={<LibraryPage />} />
				<Route path="/library/recipe/:recipeId" element={<RecipePage />} />
				<Route path="/library/recipe/:recipeId/edit" element={<RecipeEditPage />} />
				<Route path="/profile" element={<ProfilePage />} />
			</Route>
			<Route path="*" element={<NotFoundPage />} />
		</>,
	),
	{ basename: import.meta.env.BASE_URL },
)

export default function App() {
	return (
		<AuthProvider>
			<RouterProvider router={router} />
		</AuthProvider>
	)
}
