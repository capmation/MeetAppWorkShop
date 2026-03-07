import { test, expect } from '@playwright/test'

// These tests require a logged-in state.
// In a real CI environment, you would mock Firebase Auth.
// For now these are smoke tests that verify the UI structure.

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    // In production CI: inject mock auth state via localStorage or cookie
    // For now, verify redirect behavior for unauthenticated users
    await page.goto('/home')
  })

  test('redirects to login when not authenticated', async ({ page }) => {
    await expect(page).toHaveURL('/')
  })
})

test.describe('Meeting creation UI (mocked auth)', () => {
  test('join with link validates input', async ({ page }) => {
    // This test would run after setting up mock auth
    // Placeholder for future authenticated E2E tests
    await page.goto('/')
    await expect(page.getByText('Welcome back')).toBeVisible()
  })
})
