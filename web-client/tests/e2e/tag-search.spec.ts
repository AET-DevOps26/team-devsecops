import {expect, test} from '@playwright/test'

const recipe = {
	id: 1,
	title: 'Tomato Pasta',
	portions: 2,
	ingredients: [{name: 'tomato', quantity: 4, unit: 'pcs'}],
	instructions: ['boil pasta', 'add sauce'],
	nutrients: {calories: 500, protein: 20, fat: 10, carbs: 60},
}

test('tag selector reveals nested tags and folds the selection into the prompt', async ({page}) => {
	// Arrange
	await page.route('**/api/v1/users/login', (route) =>
		route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({token: 'tok'})}),
	)
	await page.route('**/api/v1/users/profile', (route) =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({username: 'demo', preferences: {}}),
		}),
	)
	let recipesRequestBody: string | null = null
	await page.route('**/api/v1/ai/recipes', (route) => {
		recipesRequestBody = route.request().postData()
		route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify([recipe])})
	})

	// Act & Assert
	await page.goto('login')
	await page.getByLabel('Username').fill('demo')
	await page.getByLabel('Password', {exact: true}).first().fill('test')
	await page.keyboard.press('Enter')
	await expect(page).toHaveURL(/\/generate$/)

	// a default tag is shown, but its nested reveal only appears once the parent is selected
	const dinner = page.getByRole('button', {name: 'Dinner', exact: true})
	await expect(dinner).toBeVisible()
	await expect(page.getByRole('button', {name: 'Curry', exact: true})).toHaveCount(0)

	await dinner.click()
	await expect(page.getByRole('button', {name: 'Curry', exact: true})).toBeVisible()

	// the free-text input and the selected tag both feed into the generation request
	await page.getByPlaceholder(/Type what you think/i).fill('quick weeknight meal')
	await page.getByRole('button', {name: 'Generate'}).click()

	await expect(page).toHaveURL(/\/generate\/results$/)
	await expect(page.getByRole('button', {name: /Tomato Pasta/})).toBeVisible()

	expect(recipesRequestBody).not.toBeNull()
	const sentPrompt = JSON.parse(recipesRequestBody!).prompt as string
	expect(sentPrompt).toContain('quick weeknight meal')
	expect(sentPrompt).toContain('Preferences:')
	expect(sentPrompt).toContain('Dinner')
})
