import {useTranslation} from 'react-i18next'
import {facets, tags, tagsById} from '../recipeFormat'
import {localizeFacetLabel, localizeTagLabel} from '../locales/recipeTagLabels'

// background by reveal order: defaults (0) are neutral, each further hop is a touch more orange.
// In dark mode the orange is layered as translucent tints over the dark surface so it deepens
// with each hop without the biting brightness of the light palette.
const TINT_BY_ORDER = [
	'bg-white text-gray-700 border-gray-300 hover:border-orange-400 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-600',
	'bg-orange-50 text-gray-800 border-orange-200 hover:border-orange-400 dark:bg-orange-500/10 dark:text-orange-100 dark:border-orange-500/30',
	'bg-orange-100 text-gray-800 border-orange-300 hover:border-orange-400 dark:bg-orange-500/20 dark:text-orange-100 dark:border-orange-500/40',
	'bg-orange-200 text-gray-900 border-orange-300 hover:border-orange-500 dark:bg-orange-500/30 dark:text-orange-50 dark:border-orange-500/50',
	'bg-orange-300 text-gray-900 border-orange-400 hover:border-orange-500 dark:bg-orange-500/40 dark:text-orange-50 dark:border-orange-500/60',
]

interface TagSelectorProps {
  selectedTags: string[]
  onChange: (selected: string[]) => void
}

export function TagSelector({selectedTags, onChange}: TagSelectorProps) {
	const {i18n} = useTranslation()
	const selectedTagsSet = new Set(selectedTags)

	// order = number of "reveal-hops" from a default tag, walking only through selected tags.
	const order = new Map<string, number>()
	for (const facet of facets) for (const id of facet.defaultTags) order.set(id, 0)
	let changed = true
	while (changed) {
		changed = false
		for (const id of selectedTags) {
			const depth = order.get(id)
			if (depth === undefined) continue
			for (const revealed of tagsById.get(id)?.reveals ?? []) {
				if ((order.get(revealed) ?? Infinity) > depth + 1) {
					order.set(revealed, depth + 1)
					changed = true
				}
			}
		}
	}
	// keep a selected tag visible even if the parent that revealed it was since deselected
	for (const id of selectedTags) if (!order.has(id)) order.set(id, 0)

	function toggle(id: string) {
		onChange(selectedTagsSet.has(id) ? selectedTags.filter((s) => s !== id) : [...selectedTags, id])
	}

	return (
		<div className="flex flex-col gap-3">
			{facets.map((facet) => {
				const facetTags = tags
					.filter((tag) => tag.categoryId === facet.id && order.has(tag.id))
					.sort((a, b) => order.get(a.id)! - order.get(b.id)!)
				if (facetTags.length === 0) return null
				return (
					<div key={facet.id}>
						<h3 className="text-sm font-semibold text-gray-700 dark:text-neutral-200 mb-1">{localizeFacetLabel(facet.id, facet.label, i18n.language)}</h3>
						<div className="flex flex-wrap gap-2">
							{facetTags.map((tag) => {
								const active = selectedTagsSet.has(tag.id)
								const tint = TINT_BY_ORDER[Math.min(order.get(tag.id)!, TINT_BY_ORDER.length - 1)]
								return (
									<button
										key={tag.id}
										type="button"
										aria-pressed={active}
										onClick={() => toggle(tag.id)}
										className={`px-3 py-1 rounded-full border text-sm cursor-pointer transition-colors ${
											active ? 'bg-orange-500 dark:bg-orange-700 text-white border-orange-500 dark:border-orange-700' : tint
										}`}
									>
										{localizeTagLabel(tag.id, tag.label, i18n.language)}
									</button>
								)
							})}
						</div>
					</div>
				)
			})}
		</div>
	)
}
