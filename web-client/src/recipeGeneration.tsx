import type {Dispatch, ReactNode, SetStateAction} from 'react';
import {createContext, useCallback, useContext, useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import type {components} from './api';
import {tagsById} from './recipeFormat';
import {errorMessage} from './apiError';
import {SessionExpiredError, useApi} from './useApi';
import {currentLanguage} from './i18n';

// id is stored on the recipe once it is saved
type Recipe = components['schemas']['RecipeInput'] & { id?: number }
type RecipeRequest = components['schemas']['RecipeRequest']

export interface RecipeGenerationContextValue {
	prompt: string;
	setPrompt: Dispatch<SetStateAction<string>>;
	selectedTags: string[];
	setSelectedTags: Dispatch<SetStateAction<string[]>>;
	recipes: Recipe[];
	setRecipes: Dispatch<SetStateAction<Recipe[]>>;
	status: string | null;
	loading: boolean;
	generate: () => void;
}

const RecipeGenerationContext = createContext<RecipeGenerationContextValue | null>(null);

function safeGetArrayFromStorage(key: string) {
	try {
		const stored = sessionStorage.getItem(key);
		return stored ? (JSON.parse(stored)) : [];
	} catch {
		return [];
	}
}

// Lives above the tab layout so an ongoing generation survives navigating to another tab
export function RecipeGenerationProvider({children}: { children: ReactNode }) {
	const {t} = useTranslation();
	const apiFetch = useApi();
	const navigate = useNavigate();

	const [prompt, setPrompt] = useState(() => sessionStorage.getItem('recipe_prompt') ?? '');
	const [selectedTags, setSelectedTags] = useState<string[]>(() => safeGetArrayFromStorage('recipe_tags'));
	const [recipes, setRecipes] = useState<Recipe[]>(() => safeGetArrayFromStorage('generated_recipes'));
	const [status, setStatus] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		sessionStorage.setItem('generated_recipes', JSON.stringify(recipes));
	}, [recipes]);

	const generate = useCallback(() => {
		setLoading(true);
		setStatus(t('generate.generatingStatus'));
		setRecipes([]);
		sessionStorage.setItem('recipe_prompt', prompt);
		sessionStorage.setItem('recipe_tags', JSON.stringify(selectedTags));
		navigate('/generate/results');

		void (async () => {
			try {
				const tagLabels = selectedTags.map((id) => tagsById.get(id)?.label).filter(Boolean);
				const fullPrompt = tagLabels.length > 0 ? `${prompt}\n\nPreferences: ${tagLabels.join(', ')}` : prompt;
				const body: RecipeRequest = {prompt: fullPrompt, language: currentLanguage()};
				const response = await apiFetch('/ai/recipes', {
					method: 'POST',
					headers: {'content-type': 'application/json'},
					body: JSON.stringify(body),
				});
				if (!response.ok) throw new Error(await errorMessage(response));
				const data = (await response.json()) as Recipe[];
				setRecipes(data);
				setStatus(data.length === 0 ? t('generate.noRecipes') : null);
			} catch (e) {
				if (e instanceof SessionExpiredError) return;
				setStatus(t('common.error', {message: e instanceof Error ? e.message : String(e)}));
			} finally {
				setLoading(false);
			}
		})();
	}, [apiFetch, navigate, prompt, selectedTags, t]);

	const value: RecipeGenerationContextValue = {
		prompt, setPrompt, selectedTags, setSelectedTags, recipes, setRecipes, status, loading, generate,
	};
	return <RecipeGenerationContext.Provider value={value}>{children}</RecipeGenerationContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRecipeGeneration(): RecipeGenerationContextValue {
	const ctx = useContext(RecipeGenerationContext);
	if (!ctx) throw new Error('useRecipeGeneration must be used within a RecipeGenerationProvider');
	return ctx;
}

export type {Recipe};
