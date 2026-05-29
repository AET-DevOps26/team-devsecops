import { test, expect } from '@playwright/test'

const recipe = {
  id: 1,
  title: 'Tomato Pasta',
  portions: 2,
  ingredients: [{ name: 'tomato', quantity: 4, unit: '' }],
  instructions: ['boil pasta', 'add sauce'],
  nutrients: { calories: 500, protein: 20, fat: 10, carbs: 60 },
}

test('login -> generate -> open recipe -> log out', async ({ page }) => {
  await page.route('**/api/v1/users/login', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: 'tok' }) }),
  )
  await page.route('**/api/v1/ai/recipes', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([recipe]) }),
  )
  await page.route('**/api/v1/users/logout', (route) => route.fulfill({ status: 200 }))
  // ProfilePage runs a GET on mount; a 401 here would trigger an auto-signOut
  // and detach the Log out button before we can click it
  await page.route('**/api/v1/users/profile', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ username: 'demo', preferences: {} }),
    }),
  )

  await page.goto('login')
  await page.getByLabel('Username').fill('demo')
  await page.getByLabel('Password', { exact: true }).first().fill('test')
  // both the active tab and the submit button are labelled "Login"; submit via Enter
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(/\/generate$/)
  await page.getByPlaceholder(/What do you want to cook/i).fill('pasta')
  await page.getByRole('button', { name: 'Generate' }).click()

  await page.getByRole('button', { name: /Tomato Pasta/ }).click()
  await expect(page).toHaveURL(/\/recipe$/)
  await expect(page.getByRole('heading', { name: 'Tomato Pasta' })).toBeVisible()

  await page.goto('profile')
  await page.getByRole('button', { name: 'Log out' }).click()
  await expect(page).toHaveURL(/\/login$/)
})
