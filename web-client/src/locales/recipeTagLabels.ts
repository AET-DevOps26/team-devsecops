// Localized labels for the recipe tag taxonomy (src/recipeTags.json).
// English labels live in the taxonomy itself and act as the fallback.

import { recipeFacetLabelsDe, recipeTagLabelsDe } from './recipeTagsDe'
import { recipeFacetLabelsHu, recipeTagLabelsHu } from './recipeTagsHu'

const tagLabels: Record<string, Record<string, string>> = {
	DE: recipeTagLabelsDe,
	HU: recipeTagLabelsHu,
}

const facetLabels: Record<string, Record<string, string>> = {
	DE: recipeFacetLabelsDe,
	HU: recipeFacetLabelsHu,
}

const baseLanguage = (lang: string) => lang.toUpperCase().split('-')[0]

export function localizeTagLabel(id: string, fallback: string, lang: string): string {
	return tagLabels[baseLanguage(lang)]?.[id] ?? fallback
}

export function localizeFacetLabel(id: string, fallback: string, lang: string): string {
	return facetLabels[baseLanguage(lang)]?.[id] ?? fallback
}
