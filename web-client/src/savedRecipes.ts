// Generated recipes have no id, so nothing distinguishes a saved one from an unsaved one
// when the generate page is restored after navigating away. We remember the recipes saved
// this session by title in sessionStorage so the filled bookmark persists (and the recipe
// isn't saved twice). Cleared whenever a new batch is generated.
const KEY = 'saved_recipe_titles'

function read(): string[] {
  const stored = sessionStorage.getItem(KEY)
  return stored ? (JSON.parse(stored) as string[]) : []
}

export function isRecipeSaved(title: string): boolean {
  return read().includes(title)
}

export function rememberRecipeSaved(title: string): void {
  const titles = read()
  if (!titles.includes(title)) sessionStorage.setItem(KEY, JSON.stringify([...titles, title]))
}

export function clearSavedRecipes(): void {
  sessionStorage.removeItem(KEY)
}
