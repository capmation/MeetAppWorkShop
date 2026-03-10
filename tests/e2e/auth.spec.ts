import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('shows login page at root', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('CAPCOM 2.0')).toBeVisible()
    await expect(page.getByText('Continue with Google')).toBeVisible()
  })

  test('redirects unauthenticated user from /home to login', async ({ page }) => {
    await page.goto('/home')
    await expect(page).toHaveURL('/')
  })

  test('redirects unauthenticated user from /meet/:id to login', async ({ page }) => {
    await page.goto('/meet/testroom123')
    await expect(page).toHaveURL('/')
  })

  test('login page has accessible button', async ({ page }) => {
    await page.goto('/')
    const btn = page.getByRole('button', { name: /continue with google/i })
    await expect(btn).toBeVisible()
    await expect(btn).toBeEnabled()
  })
})
